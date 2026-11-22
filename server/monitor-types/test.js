const { ManualMonitorType } = require("./manual");

class TestMonitorType extends ManualMonitorType {
    name = "Test";
    type = "test";
    description = "A development monitor with a manually controlled status";
}

module.exports = {
    TestMonitorType,
};
