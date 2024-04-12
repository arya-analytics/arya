//
// Created by Synnax on 4/1/2024.
//

#include <include/gtest/gtest.h>
#include "driver/driver/ni/ni_scanner.h"
#include "client/cpp/synnax/synnax.h"
#include <stdio.h>

TEST(NiScannerTests, testGetDevices){
    ni::NiScanner scanner;
    auto devices = scanner.getDevices();
    std::cout << devices.dump(4) << std::endl;
    ASSERT_TRUE(devices["devices"].size() > 0);
}