import React, { Component } from "react";
import PropTypes from "prop-types";
import { List, Map } from "immutable";
import PercentToTarget from "./PercentToTarget";
import AnnualChart from "./AnnualChart";
import {
  getFirstOfYear,
  getFirstOfNextYear,
  normalizeToUSD,
  percentageThroughDates
} from "./util";
import "./AnnualChartWithGoal.css";

class AnnualChartWithGoal extends Component {
  static propTypes = {
    goal: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    transactions: PropTypes.instanceOf(List).isRequired
  };

  render() {
    const { category, exchangeRates, goal, transactions } = this.props;
    const firstOfYear = getFirstOfYear();
    const firstOfNextYear = getFirstOfNextYear();
    const selectedTransactions = transactions
      .filter(t => t.get("category") === category) // filter for category
      .filter(t => t.get("date") >= firstOfYear); // only dates within range
    const normalizedTransactions = normalizeToUSD(
      selectedTransactions,
      exchangeRates
    );
    const total = normalizedTransactions.reduce(
      (runningTotal, t) => runningTotal + t.get("amount"),
      0
    );
    const progressThroughYear = percentageThroughDates(
      firstOfYear,
      firstOfNextYear
    );

    return (
      <div className="AnnualChartWithGoal">
        <div className="ten">
          <AnnualChart transactions={normalizedTransactions} />
        </div>
        <div className="two">
          <PercentToTarget
            actualCurrentVal={total}
            targetVal={goal}
            progressThroughPeriod={progressThroughYear}
          />
        </div>
      </div>
    );
  }
}

export default AnnualChartWithGoal;
