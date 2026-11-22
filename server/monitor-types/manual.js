const { MonitorType } = require("./monitor-type");
const { UP, DOWN, PENDING, MAINTENANCE } = require("../../src/util");

class ManualMonitorType extends MonitorType {
    name = "Manual";
    type = "manual";
    description = "A monitor that allows manual control of the status";
    supportsConditions = false;
    conditionVariables = [];

    allowCustomStatus = true;

    /**
     * @inheritdoc
     */
    async check(monitor, heartbeat) {
        if (monitor.manual_status !== null && monitor.manual_status !== undefined) {
            heartbeat.status = Number(monitor.manual_status);
            switch (heartbeat.status) {
                case UP:
                    heartbeat.msg = "Up";
                    break;
                case DOWN:
                    heartbeat.msg = "Down";
                    break;
                case MAINTENANCE:
                    heartbeat.msg = "Monitor under maintenance";
                    break;
                case PENDING:
                    heartbeat.msg = "Pending";
                    break;
                default:
                    heartbeat.status = PENDING;
                    heartbeat.msg = "Pending";
            }
        } else {
            heartbeat.status = PENDING;
            heartbeat.msg = "Manual monitoring - No status set";
        }
    }
}

module.exports = {
    ManualMonitorType,
};
