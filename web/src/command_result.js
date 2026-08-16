// Web Prototype Command Output & Result Standard Structure

export class CommandResult {
  constructor({
    success = true,
    actionType = "",
    summary = "",
    logs = [],
    deliverables = {},
    stateChanges = {}
  } = {}) {
    this.success = success;
    this.actionType = actionType;
    this.summary = summary;
    this.logs = Array.isArray(logs) ? logs : (logs ? [logs] : []);
    this.deliverables = deliverables;
    this.stateChanges = stateChanges;
  }
}
