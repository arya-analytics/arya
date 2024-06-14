import dataclasses
import time
import synnax as sy
from synnax.control.controller import Controller
import numpy as np
from scipy.signal import find_peaks

client = sy.Synnax()
from common import (
    SENSORS,
    VALVES,
    SUPPLY_PT,
    PNEUMATICS_PT,
    PRESS_ISO_STATE,
    DAQ_TIME,
    OX_TPC_CMD,
    OX_TPC_ACK,
    OX_MPV_CMD,
    OX_MPV_ACK,
    OX_PRESS_CMD,
    GAS_BOOSTER_ISO_CMD,
    OX_VENT_CMD,
    OX_PT_1,
    PRESS_PT_1,
    PRESS_ISO_CMD,
    OX_PRESS_STATE,
)


@dataclasses.dataclass
class TPCParameters:
    l_stand_press_target: int
    scuba_press_target: int
    press_1_step: int
    press_2_step: int
    press_step_delay: float
    tpc_upper_bound: int
    tpc_lower_bound: int


TPC_CMD = OX_PRESS_CMD
TPC_CMD_ACK = OX_PRESS_STATE
MPV_CMD = OX_MPV_CMD
SUPPLY_CMD = GAS_BOOSTER_ISO_CMD
VENT_CMD = OX_VENT_CMD
PRESS_TANK_PT = PRESS_PT_1
FUEL_TANK_PT = OX_PT_1
START_SIM_CMD = "start_sim_cmd"

sim_cmd_time = client.channels.create(
    name=f"{START_SIM_CMD}_time",
    data_type=sy.DataType.TIMESTAMP,
    is_index=True,
    retrieve_if_name_exists=True,
)

sim_cmd = client.channels.create(
    name=START_SIM_CMD, data_type=sy.DataType.UINT8, index=sim_cmd_time.key,
    retrieve_if_name_exists=True,
)


def start_sim_cmd(aut: Controller):
    return sim_cmd.key in aut.state and aut[START_SIM_CMD] == 1


def execute_auto(params: TPCParameters, wait_for_confirm: bool = False) -> sy.Range:
    def run_tpc(auto: Controller):
        pressure = auto[FUEL_TANK_PT]
        one_open = auto[TPC_CMD_ACK]
        if pressure > params.tpc_upper_bound:
            if one_open:
                auto[TPC_CMD] = False
        elif pressure < params.tpc_lower_bound:
            auto[TPC_CMD] = True
        return pressure < 15

    with client.control.acquire(
        "Autosequence",
        write=[TPC_CMD, MPV_CMD, SUPPLY_CMD, VENT_CMD, PRESS_ISO_CMD],
        read=[TPC_CMD_ACK, PRESS_TANK_PT, FUEL_TANK_PT, START_SIM_CMD],
        write_authorities=[250],
    ) as auto:
        if wait_for_confirm:
            auto.wait_until(start_sim_cmd)
        try:
            print("Starting TPC Test. Setting initial system state.")
            auto.set(
                {
                    TPC_CMD: 0,
                    MPV_CMD: 0,
                    SUPPLY_CMD: 0,
                    VENT_CMD: 1,
                }
            )

            time.sleep(2)

            print(f"Pressing SCUBA and L-Stand to 50 PSI")

            # Pressurize l-stand and scuba to 50 PSI
            # Open TPC Valve
            auto[TPC_CMD] = True
            auto[PRESS_ISO_CMD] = True

            dual_press_start = sy.TimeStamp.now()

            curr_target = params.press_1_step
            while True:
                print(f"Pressing L-Stand to {curr_target} PSI")
                auto[SUPPLY_CMD] = True
                auto.wait_until(lambda c: c[FUEL_TANK_PT] > curr_target)
                auto[SUPPLY_CMD] = False
                curr_target += params.press_1_step
                curr_target = min(curr_target, params.l_stand_press_target)
                if auto[FUEL_TANK_PT] > params.l_stand_press_target:
                    break
                print("Taking a nap")
                time.sleep(params.press_step_delay)

            dual_press_end = sy.TimeStamp.now()
            client.ranges.create(
                name=f"{dual_press_start.__str__()[11:16]} Dual Press Sequence",
                time_range=sy.TimeRange(dual_press_start, dual_press_end),
                # a nice red
                color="#D81E5B"
            )

            press_tank_start = sy.TimeStamp.now()

            print("Pressurized. Waiting for five seconds")
            time.sleep(params.press_step_delay)
            # ISO off TESCOM and press scuba with ISO
            auto[TPC_CMD] = False
            auto[PRESS_ISO_CMD] = False
            auto[SUPPLY_CMD] = False

            curr_target = params.l_stand_press_target + params.press_2_step
            while True:
                auto[SUPPLY_CMD] = True
                auto.wait_until(lambda c: c[PRESS_TANK_PT] > curr_target)
                auto[SUPPLY_CMD] = False
                curr_target += params.press_2_step
                curr_target = min(curr_target, params.scuba_press_target)
                if auto[PRESS_TANK_PT] > params.scuba_press_target:
                    break
                print("Taking a nap")
                time.sleep(params.press_step_delay)

            print("Pressurized. Waiting for five seconds")
            time.sleep(2)

            press_tank_end = sy.TimeStamp.now()
            client.ranges.create(
                name=f"{press_tank_start.__str__()[11:16]} Press Tank Pressurization",
                time_range=sy.TimeRange(press_tank_start, press_tank_end),
                # a nice blue
                color="#1E90FF"
            )

            start = sy.TimeStamp.now()

            print("Opening MPV")
            auto[PRESS_ISO_CMD] = True
            auto[MPV_CMD] = True
            auto.wait_until(lambda c: run_tpc(c))
            print("Test complete. Safeing System")

            rng = client.ranges.create(
                name=f"{start.__str__()[11:16]} Bang Bang Sim",
                time_range=sy.TimeRange(start, sy.TimeStamp.now()),
                color="#bada55",
            )
            rng.meta_data._set({
                "l_stand_press_target": f"{params.l_stand_press_target} PSI",
                "scuba_press_target": f"{params.scuba_press_target} PSI",
                "press_1_step": f"{params.press_1_step} PSI",
                "press_2_step": f"{params.press_2_step} PSI",
                "press_step_delay": f"{params.press_step_delay} seconds",
                "tpc_upper_bound": f"{params.tpc_upper_bound} PSI",
                "tpc_lower_bound": f"{params.tpc_lower_bound} PSI",
            })

            auto.set(
                {
                    TPC_CMD: 1,
                    SUPPLY_CMD: 0,
                    # Open vent
                    VENT_CMD: 0,
                    MPV_CMD: 0,
                }
            )

            return rng

        except KeyboardInterrupt:
            print("Test interrupted. Safeing System")
            auto.set({
                TPC_CMD: 1,
                SUPPLY_CMD: 0,
                VENT_CMD: 0,
                MPV_CMD: 1,
            })


def perform_analysis(params: TPCParameters, rng: sy.Range) -> TPCParameters:
    print("Performing analysis on the test results. Starting with a 5 second sleep")
    time.sleep(5)
    fuel_pt = rng[FUEL_TANK_PT].to_numpy()
    peaks, _ = find_peaks(fuel_pt, height=params.tpc_upper_bound)
    avg_diff = np.mean(fuel_pt[peaks] - params.tpc_upper_bound)
    rng.meta_data._set("overshoot_avg", f"{avg_diff} PSI")
    tpc_upper_bound = params.tpc_upper_bound - avg_diff
    return TPCParameters(
        l_stand_press_target=params.l_stand_press_target,
        scuba_press_target=params.scuba_press_target,
        press_1_step=params.press_1_step,
        press_2_step=params.press_2_step,
        press_step_delay=params.press_step_delay,
        tpc_upper_bound=tpc_upper_bound,
        tpc_lower_bound=params.tpc_lower_bound
    )


if __name__ == "__main__":
    initial_params = TPCParameters(
        l_stand_press_target=65,
        scuba_press_target=275,
        press_1_step=20,
        press_2_step=50,
        press_step_delay=1,
        tpc_upper_bound=50,
        tpc_lower_bound=45
    )
    res = execute_auto(initial_params, wait_for_confirm=True)
    next_params = perform_analysis(initial_params, res)
    res = execute_auto(next_params)
    next_params.tpc_upper_bound = initial_params.tpc_upper_bound
    perform_analysis(next_params, res)
