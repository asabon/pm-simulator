// Web Prototype Customer & Stakeholder Management Service

import { CommandResult } from "./command_result.js";

export class CustomerService {
  constructor(customer = null, archetype = null) {
    this.customer = customer;
    this.archetype = archetype;
    this.satisfaction = customer ? customer.satisfaction : 70.0;
  }

  setCustomerData(customer, archetype) {
    this.customer = customer;
    this.archetype = archetype;
    if (customer) {
      this.satisfaction = customer.satisfaction;
    }
  }

  getCustomer() {
    return this.customer;
  }

  getArchetype() {
    return this.archetype;
  }

  adjustSatisfaction(delta, reason = "") {
    if (!this.customer) return new CommandResult({ success: false, actionType: "ADJUST_SATISFACTION" });

    const prev = this.satisfaction;
    this.satisfaction = Math.min(100.0, Math.max(0.0, this.satisfaction + delta));
    this.customer.satisfaction = this.satisfaction;

    return new CommandResult({
      success: true,
      actionType: "ADJUST_SATISFACTION",
      summary: `顧客満足度が ${delta >= 0 ? "+" : ""}${delta.toFixed(0)}% 変化しました (${prev.toFixed(0)}% -> ${this.satisfaction.toFixed(0)}%)。`,
      logs: reason ? [`💬 顧客満足度変動 (${reason}): ${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`] : [],
      deliverables: { satisfaction: this.satisfaction },
      stateChanges: { satisfactionDelta: delta }
    });
  }

  getSpeech() {
    if (!this.customer) return "";
    return this.customer.speak();
  }
}
