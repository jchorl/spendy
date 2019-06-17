import React, { Component } from "react";
import PropTypes from "prop-types";
import { List, Map, Set } from "immutable";
import CategoryPicker from "./CategoryPicker";
import PercentToTarget from "./PercentToTarget";
import ThisMonthTotal from "./ThisMonthTotal";
import ThisMonthCategorized from "./ThisMonthCategorized";
import { MONTHLY_SPEND_GOAL } from "./config";
import {
  getFirstOfMonth,
  getFirstOfNextMonth,
  normalizeToUSD,
  percentageThroughDates
} from "./util";
import "./ThisMonth.css";

const DEFAULT_EXCLUDED_CATEGORIES = Set([
  "Health",
  "Home Insurance",
  "Laundry",
  "Life Insurance",
  "Music",
  "Phone",
  "Savings",
  "Rent",
  "Rewards",
  "Utilities"
]);

function filterForChargesThisMonth(transactions) {
  const firstOfMonth = getFirstOfMonth();
  return transactions
    .filter(t => t.get("date") >= firstOfMonth) // only dates within range
    .filter(t => t.get("amount") > 0); // filter for only expenses
}

class ThisMonth extends Component {
  static propTypes = {
    transactions: PropTypes.instanceOf(List).isRequired,
    exchangeRates: PropTypes.instanceOf(Map).isRequired
  };

  constructor(props) {
    super(props);

    const { transactions } = props;
    const chargesThisMonth = filterForChargesThisMonth(transactions);
    const categories = chargesThisMonth.map(t => t.get("category")).toSet();

    this.state = {
      selectedCategories: categories.subtract(DEFAULT_EXCLUDED_CATEGORIES)
    };
  }

  toggleCategory = category => {
    let { selectedCategories } = this.state;

    if (selectedCategories.contains(category)) {
      selectedCategories = selectedCategories.delete(category);
    } else {
      selectedCategories = selectedCategories.add(category);
    }

    this.setState({ selectedCategories });
  };

  render() {
    const { selectedCategories } = this.state;
    const { exchangeRates, transactions } = this.props;
    const chargesThisMonth = filterForChargesThisMonth(transactions);
    const categories = chargesThisMonth
      .map(t => t.get("category"))
      .toSet()
      .toList()
      .sort();
    const selectedChargesThisMonth = chargesThisMonth.filter(t =>
      selectedCategories.includes(t.get("category"))
    );
    const normalizedCharges = normalizeToUSD(
      selectedChargesThisMonth,
      exchangeRates
    );
    const total = normalizedCharges.reduce(
      (runningTotal, t) => runningTotal + t.get("amount"),
      0
    );
    const progressThroughMonth = percentageThroughDates(
      getFirstOfMonth(),
      getFirstOfNextMonth()
    );

    return (
      <div className="ThisMonth">
        <CategoryPicker
          categories={categories}
          selected={selectedCategories}
          onToggle={this.toggleCategory}
        />
        <div className="charts">
          <div className="five">
            <div className="chartTitle">Total</div>
            <ThisMonthTotal transactions={normalizedCharges} />
          </div>
          <div className="five">
            <div className="chartTitle">Categorized</div>
            <ThisMonthCategorized transactions={normalizedCharges} />
          </div>
          <div className="two">
            <PercentToTarget
              actualCurrentVal={total}
              targetVal={MONTHLY_SPEND_GOAL}
              progressThroughPeriod={progressThroughMonth}
              inverted={true}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ThisMonth;
