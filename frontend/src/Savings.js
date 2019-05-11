import React, { Component } from "react";
import PropTypes from "prop-types";
import { List, Map } from "immutable";
import PercentToTarget from "./PercentToTarget";
import SavingsChart from "./SavingsChart";
import { YEARLY_SAVINGS_GOAL } from "./config";
import {
  getFirstOfYear,
  getFirstOfNextYear,
  normalizeToUSD,
  percentageThroughDates
} from "./util";
import "./Savings.css";

class Savings extends Component {
  static propTypes = {
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    transactions: PropTypes.instanceOf(List).isRequired
  };

  render() {
    const { exchangeRates, transactions } = this.props;
    const firstOfYear = getFirstOfYear();
    const firstOfNextYear = getFirstOfNextYear();
    const savings = transactions
      .filter(t => t.get("category") === "Savings") // filter for only savings
      .filter(t => t.get("date") >= firstOfYear); // only dates within range
    const normalizedSavings = normalizeToUSD(savings, exchangeRates);
    const total = normalizedSavings.reduce(
      (runningTotal, t) => runningTotal + t.get("amount"),
      0
    );
    const progressThroughYear = percentageThroughDates(
      firstOfYear,
      firstOfNextYear
    );

    return (
      <div className="Savings">
        <div className="ten">
          <SavingsChart transactions={normalizedSavings} />
        </div>
        <div className="two">
          <PercentToTarget
            actualCurrentVal={total}
            targetVal={YEARLY_SAVINGS_GOAL}
            progressThroughPeriod={progressThroughYear}
          />
        </div>
      </div>
    );
  }
}

export default Savings;
