from pydantic import BaseModel, conint, confloat, constr, validator, Field
from typing import List, Literal, Union, Optional, Dict
from uuid import uuid4
from synnax.hardware.task import TaskPayload, Task, MetaTask
from synnax.telem import Rate, CrudeRate
import json

UnitsVolts = Literal["Volts"]
UnitsAmps = Literal["Amps"]
UnitsDegF = Literal["DegF"]
UnitsDegC = Literal["DegC"]
UnitsDegR = Literal["DegR"]
UnitsKelvins = Literal["Kelvins"]
UnitsStrain = Literal["Strain"]
UnitsOhms = Literal["Ohms"]
UnitsHz = Literal["Hz"]
UnitsSeconds = Literal["Seconds"]
UnitsMeters = Literal["Meters"]
UnitsInches = Literal["Inches"]
UnitsDegAngle = Literal["Degrees"]
UnitsRadiansAngle = Literal["Radians"]
UnitsGravity = Literal["g"]
UnitsMetersPerSecondSquared = Literal["MetersPerSecondSquared"]
UnitsNewtons = Literal["Newtons"]
UnitsPounds = Literal["Pounds"]
UnitsKgForce = Literal["KilogramForce"]
UnitsLbsPerSquareInch = Literal["PoundsPerSquareInch"]
UnitsBar = Literal["Bar"]
UnitsPascals = Literal["Pascals"]
UnitsVoltsPerVolt = Literal["VoltsPerVolt"]
UnitsmVoltsPerVolt = Literal["mVoltsPerVolt"]
UnitsNewtonMeters = Literal["NewtonMeters"]
UnitsInchLbs = Literal["InchPounds"]
UnitsInOz = Literal["InchOunces"]
UnitsFtLbs = Literal["FootPounds"]

Units = Union[
    UnitsVolts,
    UnitsAmps,
    UnitsDegF,
    UnitsDegC,
    UnitsDegR,
    UnitsKelvins,
    UnitsStrain,
    UnitsOhms,
    UnitsHz,
    UnitsSeconds,
    UnitsMeters,
    UnitsInches,
    UnitsDegAngle,
    UnitsRadiansAngle,
    UnitsGravity,
    UnitsMetersPerSecondSquared,
    UnitsNewtons,
    UnitsPounds,
    UnitsKgForce,
    UnitsLbsPerSquareInch,
    UnitsBar,
    UnitsPascals,
    UnitsVoltsPerVolt,
    UnitsmVoltsPerVolt,
    UnitsNewtonMeters,
    UnitsInchLbs,
    UnitsInOz,
    UnitsFtLbs,
]


class LinScale(BaseModel):
    type: Literal["linear"] = "linear"
    slope: confloat(gt=0)
    y_intercept: float
    pre_scaled_units: Units
    scaled_units: Units


class MapScale(BaseModel):
    type: Literal["map"] = "map"
    pre_scaled_min: float
    pre_scaled_max: float
    scaled_min: float
    scaled_max: float
    pre_scaled_units: Units


class TableScale(BaseModel):
    type: Literal["table"] = "table"
    pre_scaled_vals: List[float]
    scaled_vals: List[float]
    pre_scaled_units: Units


class NoScale(BaseModel):
    type: Literal["none"] = "none"


Scale = Union[LinScale, MapScale, TableScale, NoScale]
ScaleType = Literal["linear", "map", "table", "none"]
TerminalConfig = Literal["Cfg_Default", "RSE", "NRSE", "Diff", "PseudoDiff"]
ExcitationSource = Literal["Internal", "External", "None"]


class BaseAIChan(BaseModel):
    name: str = ""
    key: str
    channel: Optional[int]
    port: int
    enabled: bool = True

    def __init__(self, **data):
        if "key" not in data:
            data["key"] = str(uuid4())
        super().__init__(**data)


class MinMaxVal(BaseModel):
    min_val: float = 0
    max_val: float = 1


class AIAccelChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_accel"] = "ai_accel"
    terminal_config: TerminalConfig = "Cfg_Default"
    sensitivity: float
    sensitivity_units: Literal["mVoltsPerG", "VoltsPerG"]
    units: Literal["g", "MetersPerSecondSquared", "InchesPerSecondSquared"]
    current_excit_source: ExcitationSource
    current_excit_val: float
    custom_scale: Scale = NoScale()


class AIAccel4WireDCVoltageChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_accel_4_wire_dc_voltage"] = "ai_accel_4_wire_dc_voltage"
    terminal_config: TerminalConfig = "Cfg_Default"
    sensitivity: float
    sensitivity_units: Literal["mVoltsPerG", "VoltsPerG"]
    units: Literal["g", "MetersPerSecondSquared", "InchesPerSecondSquared"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    use_excit_for_scaling: bool
    custom_scale: Scale = NoScale()


class AIAccelChargeChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_accel_charge"] = "ai_accel_charge"
    units: Literal["g", "MetersPerSecondSquared", "InchesPerSecondSquared"]
    custom_scale: Scale = NoScale()


class AIBridgeChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_bridge"] = "ai_bridge"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: confloat(gt=0)
    custom_scale: Scale = NoScale()


class AIChargeChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_charge"] = "ai_charge"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["C", "uC"]
    custom_scale: Scale = NoScale()


class AICurrentChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_current"] = "ai_current"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["Amps"] = "Amps"
    shunt_resistor_loc: Literal["Default", "Internal", "External"]
    ext_shunt_resistor_val: confloat(gt=0)
    custom_scale: Scale = NoScale()


class AICurrentRMSChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_current_rms"] = "ai_current_rms"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["Amps"] = "Amps"
    shunt_resistor_loc: Literal["Default", "Internal", "External"]
    ext_shunt_resistor_val: confloat(gt=0)
    custom_scale: Scale = NoScale()


class AIForceBridgePolynomialChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_force_bridge_polynomial"] = "ai_force_bridge_polynomial"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["Newtons", "Pounds", "KilogramForce"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    forward_coeffs: List[float]
    reverse_coeffs: List[float]
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    physical_units: Literal["Newtons", "Pounds", "KilogramForce"]
    custom_scale: Scale = NoScale()


class AIForceBridgeTableChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_force_bridge_table"] = "ai_force_bridge_table"
    units: Literal["Newtons", "Pounds", "KilogramForce"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    electrical_vals: List[float]
    physical_units: Literal["Newtons", "Pounds", "KilogramForce"]
    physical_vals: List[float]
    custom_scale: Scale = NoScale()


class AIForceBridgeTwoPointLinChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_force_bridge_two_point_lin"] = "ai_force_bridge_two_point_lin"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["Newtons", "Pounds", "KilogramForce"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    physical_units: Literal["Newtons", "Pounds", "KilogramForce"]
    first_electrical_val: float
    first_physical_val: float
    second_electrical_val: float
    second_physical_val: float
    custom_scale: Scale = NoScale()


class AIForceIEPEChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_force_iepe"] = "ai_force_iepe"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["Newtons", "Pounds", "KilogramForce"]
    sensitivity: float
    sensitivity_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    current_excit_source: ExcitationSource
    current_excit_val: float
    custom_scale: Scale = NoScale()


class AIFreqVoltageChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_freq_voltage"] = "ai_freq_voltage"
    units: Literal["Hz"] = "Hz"
    threshold_level: float
    hysteresis: float
    custom_scale: Scale = NoScale()


class AIMicrophoneChan(BaseAIChan):
    type: Literal["ai_microphone"] = "ai_microphone"
    terminal_config: TerminalConfig = "Cfg_Default"
    mic_sensitivity: float
    max_snd_press_level: float
    current_excit_source: ExcitationSource
    current_excit_val: float
    units: Literal["Pascals"] = "Pascals"
    custom_scale: Scale = NoScale()


class AIPressureBridgePolynomialChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_pressure_bridge_polynomial"] = "ai_pressure_bridge_polynomial"
    units: Literal["PoundsPerSquareInch", "Pascals", "Bar"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    forward_coeffs: List[float]
    reverse_coeffs: List[float]
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    physical_units: Literal["PoundsPerSquareInch", "Pascals", "Bar"]
    custom_scale: Scale = NoScale()


class AIPressureBridgeTableChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_pressure_bridge_table"] = "ai_pressure_bridge_table"
    units: Literal["PoundsPerSquareInch", "Pascals", "Bar"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    electrical_vals: List[float]
    physical_units: Literal["PoundsPerSquareInch", "Pascals", "Bar"]
    physical_vals: List[float]
    custom_scale: Scale = NoScale()


class AIPressureBridgeTwoPointLinChan(BaseAIChan, MinMaxVal):
    type: Literal[
        "ai_pressure_bridge_two_point_lin"
    ] = "ai_pressure_bridge_two_point_lin"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["PoundsPerSquareInch", "Pascals", "Bar"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    physical_units: Literal["PoundsPerSquareInch", "Pascals", "Bar"]
    first_electrical_val: float
    first_physical_val: float
    second_electrical_val: float
    second_physical_val: float
    custom_scale: Scale = NoScale()


class AIResistanceChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_resistance"] = "ai_resistance"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["Ohms"] = "Ohms"
    resistance_config: Literal["2Wire", "3Wire", "4Wire"]
    current_excit_source: ExcitationSource
    current_excit_val: float
    custom_scale: Scale = NoScale()


class AIRosetteStrainGageChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_rosette_strain_gage"] = "ai_rosette_strain_gage"
    terminal_config: TerminalConfig = "Cfg_Default"
    rosette_type: Literal["RectangularRosette", "DeltaRosette", "TeeRosette"]
    gage_orientation: float
    rosette_meas_types: List[
        Literal[
            "PrincipleStrain1",
            "PrincipleStrain2",
            "PrincipleStrainAngle",
            "CartesianStrainX",
            "CartesianStrainY",
            "CartesianShearStrainXY",
            "MaxShearStrain",
            "MaxShearStrainAngle",
        ]
    ]
    strain_config: Literal[
        "FullBridgeI",
        "FullBridgeII",
        "FullBridgeIII",
        "HalfBridgeI",
        "HalfBridgeII",
        "QuarterBridgeI",
        "QuarterBridgeII",
    ]
    units: Literal["strain"] = "strain"
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_gage_resistance: float
    poisson_ratio: float
    lead_wire_resistance: float
    gage_factor: float


class AIRTDChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_rtd"] = "ai_rtd"
    units: Literal["DegC", "DegF", "Kelvins", "DegR"]
    rtd_type: Literal[
        "Pt3750", "Pt3851", "Pt3911", "Pt3916", "Pt3920", "Pt3928", "Pt3850"
    ]
    resistance_config: Literal["2Wire", "3Wire", "4Wire"]
    current_excit_source: ExcitationSource
    current_excit_val: float
    r0: float


class AIStrainGageChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_strain_gauge"] = "ai_strain_gauge"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["strain"] = "strain"
    strain_config: Literal[
        "full-bridge-I",
        "full-bridge-II",
        "full-bridge-III",
        "half-bridge-I",
        "half-bridge-II",
        "quarter-bridge-I",
        "quarter-bridge-II",
    ]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    gage_factor: float
    initial_bridge_voltage: float
    nominal_gage_resistance: float
    poisson_ratio: float
    lead_wire_resistance: float
    custom_scale: Scale = NoScale()


class AITempBuiltInChan(BaseAIChan):
    type: Literal["ai_temp_builtin"] = "ai_temp_builtin"
    units: Literal["DegC", "DegF", "Kelvins", "DegR"]


class AIThermocoupleChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_thermocouple"] = "ai_thermocouple"
    units: Literal["DegC", "DegF", "Kelvins", "DegR"]
    thermocouple_type: Literal["J", "K", "N", "R", "S", "T", "B", "E"]
    cjc_source: Literal["BuiltIn", "ConstVal", "Chan"]
    cjc_val: Optional[float]
    cjc_port: Optional[int]


class AIThermistorChanIex(BaseAIChan, MinMaxVal):
    type: Literal["ai_thermistor_iex"] = "ai_thermistor_iex"
    units: Literal["DegC", "DegF", "Kelvins", "DegR"]
    resistance_config: Literal["2Wire", "3Wire", "4Wire"]
    current_excit_source: ExcitationSource
    current_excit_val: float
    a: float
    b: float
    c: float


class AIThermistorChanVex(BaseAIChan, MinMaxVal):
    type: Literal["ai_thermistor_vex"] = "ai_thermistor_vex"
    units: Literal["DegC", "DegF", "Kelvins", "DegR"]
    resistance_config: Literal["2Wire", "3Wire", "4Wire"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    a: float
    b: float
    c: float
    r1: float


class AITorqueBridgePolynomialChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_torque_bridge_polynomial"] = "ai_torque_bridge_polynomial"
    units: Literal["NewtonMeters", "InchOunces", "FootPounds"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    forward_coeffs: List[float]
    reverse_coeffs: List[float]
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    physical_units: Literal["NewtonMeters", "InchOunces", "FootPounds"]
    custom_scale: Scale = NoScale()


class AITorqueBridgeTableChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_torque_bridge_table"] = "ai_torque_bridge_table"
    units: Literal["NewtonMeters", "InchOunces", "FootPounds"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    electrical_vals: List[float]
    physical_units: Literal["NewtonMeters", "InchOunces", "FootPounds"]
    physical_vals: List[float]
    custom_scale: Scale = NoScale()


class AITorqueBridgeTwoPointLinChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_torque_bridge_two_point_lin"] = "ai_torque_bridge_two_point_lin"
    units: Literal["NewtonMeters", "InchOunces", "FootPounds"]
    bridge_config: Literal["FullBridge", "HalfBridge", "QuarterBridge"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    nominal_bridge_resistance: float
    electrical_units: Literal["mVoltsPerVolt", "VoltsPerVolt"]
    physical_units: Literal["NewtonMeters", "InchOunces", "FootPounds"]
    first_electrical_val: float
    first_physical_val: float
    second_electrical_val: float
    second_physical_val: float
    custom_scale: Scale = NoScale()


class AIVelocityIEPEChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_velocity_iepe"] = "ai_velocity_iepe"
    units: Literal["MetersPerSecond", "InchesPerSecond"]
    terminal_config: TerminalConfig = "Cfg_Default"
    sensitivity: float
    sensitivity_units: Literal[
        "MillivoltsPerMillimeterPerSecond", "MilliVoltsPerInchPerSecond"
    ]
    current_excit_source: ExcitationSource
    current_excit_val: float
    custom_scale: Scale = NoScale()


class AIVoltageChan(BaseAIChan, MinMaxVal):
    """Analog Input Voltage Channel

    https://www.ni.com/docs/en-US/bundle/ni-daqmx-c-api-ref/page/daqmxcfunc/daqmxcreateaivoltagechan.html
    """

    type: Literal["ai_voltage"] = "ai_voltage"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["Volts"] = "Volts"
    custom_scale: Scale = NoScale()


class AIVoltageRMSChan(BaseAIChan, MinMaxVal):
    type: Literal["ai_voltage_rms"] = "ai_voltage_rms"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["V", "mV"]
    custom_scale: Scale = NoScale()


class AIVoltageChanWithExcit(BaseAIChan, MinMaxVal):
    type: Literal["ai_voltage_with_excit"] = "ai_voltage_with_excit"
    terminal_config: TerminalConfig = "Cfg_Default"
    units: Literal["V", "mV"]
    bridge_config: Literal["full", "half", "quarter", "none"]
    voltage_excit_source: ExcitationSource
    voltage_excit_val: float
    use_excit_for_scaling: bool
    custom_scale: Scale = NoScale()


AIChan = Union[
    AIVoltageChan,
    AIThermocoupleChan,
    AIRTDChan,
    AIPressureBridgeTwoPointLinChan,
    AIAccelChan,
    AIBridgeChan,
    AICurrentChan,
    AIForceBridgeTableChan,
    AIForceBridgeTwoPointLinChan,
    AIForceIEPEChan,
    AIMicrophoneChan,
    AIPressureBridgeTableChan,
    AIResistanceChan,
    AIStrainGageChan,
    AITempBuiltInChan,
    AITorqueBridgeTableChan,
    AITorqueBridgeTwoPointLinChan,
    AIVelocityIEPEChan,
]


class DOChan(BaseModel):
    key: str
    type: Literal["digital_output"] = "digital_output"
    enabled: bool
    cmd_channel: int
    state_channel: int
    port: int
    line: int


class DIChan(BaseModel):
    key: str
    type: Literal["digital_input"] = "digital_input"
    enabled: bool
    port: int
    line: int
    channel: int


class AnalogReadTaskConfig(BaseModel):
    device: str
    sample_rate: conint(ge=0, le=50000)
    stream_rate: conint(ge=0, le=50000)
    channels: List[AIChan]
    data_saving: bool

    @validator("stream_rate")
    def validate_stream_rate(cls, v, values):
        if "sample_rate" in values and v > values["sample_rate"]:
            raise ValueError(
                "Stream rate must be less than or equal to the sample rate"
            )
        return v

    @validator("channels")
    def validate_channel_ports(cls, v, values):
        ports = {c.port for c in v}
        if len(ports) < len(v):
            used_ports = [c.port for c in v]
            duplicate_ports = [port for port in ports if used_ports.count(port) > 1]
            raise ValueError(f"Port {duplicate_ports[0]} has already been used")
        return v


class DigitalWriteConfig(BaseModel):
    device: str
    channels: List[DOChan]
    state_rate: conint(ge=0, le=50000)
    data_saving: bool


class DigitalReadConfig(BaseModel):
    device: str
    sample_rate: conint(ge=0, le=50000)
    stream_rate: conint(ge=0, le=50000)
    data_saving: bool
    channels: List[DIChan]


class TaskStateDetails(BaseModel):
    running: bool
    message: str


class AnalogReadStateDetails(TaskStateDetails):
    errors: Optional[List[Dict[str, str]]]


class DigitalWriteTask(BaseModel):
    config: DigitalWriteConfig
    state: TaskStateDetails


class DigitalReadTask(BaseModel):
    config: DigitalReadConfig
    state: TaskStateDetails


class AnalogReadTask(MetaTask):
    TYPE = "ni_analog_read"
    config: AnalogReadTaskConfig
    internal: Task

    def __init__(
        self,
        internal: Task | None = None,
        *,
        device: str = "",
        name: str = "",
        sample_rate: CrudeRate = 0,
        stream_rate: CrudeRate = 0,
        data_saving: bool = False,
        channels: List[AIChan] = None,
    ) -> None:
        if internal is not None:
            self.internal = internal
            self.config = AnalogReadTaskConfig.parse_obj(json.loads(internal.config))
            return
        self.internal = Task(
            name=name,
            type=self.TYPE,
        )
        self.config = AnalogReadTaskConfig(
            device=device,
            sample_rate=sample_rate,
            stream_rate=stream_rate,
            data_saving=data_saving,
            channels=channels,
        )

    @property
    def name(self) -> str:
        return self.internal.name

    @property
    def key(self) -> int:
        return self.internal.key

    def to_payload(self) -> TaskPayload:
        pld = self.internal.to_payload()
        pld.config = json.dumps(self.config.dict())
        return pld

    def set_internal(self, task: Task):
        self.internal = task

    def start(self):
        self.internal.execute_command("start")

    def stop(self):
        self.internal.execute_command("stop")