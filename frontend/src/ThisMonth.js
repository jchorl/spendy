import React, { Component } from "react";
import PropTypes from "prop-types";
import { List, Map, Set } from "immutable";
import CategoryPicker from "./CategoryPicker";
import ThisMonthTotal from "./ThisMonthTotal";
import ThisMonthCategorized from "./ThisMonthCategorized";
import { getFirstOfMonth } from "./util";
import "./ThisMonth.css";

const DEFAULT_EXCLUDED_CATEGORIES = Set([
  "Laundry",
  "Life Insurance",
  "Savings",
  "Rent"
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
    const categories = chargesThisMonth.map(t => t.get("category")).toSet();
    const selectedChargesThisMonth = chargesThisMonth.filter(t =>
      selectedCategories.includes(t.get("category"))
    );

    return (
      <div className="ThisMonth">
        <CategoryPicker
          categories={categories}
          selected={selectedCategories}
          onToggle={this.toggleCategory}
        />
        <div className="charts">
          <div className="half">
            <ThisMonthTotal
              transactions={selectedChargesThisMonth}
              exchangeRates={exchangeRates}
            />
          </div>
          <div className="half">
            <ThisMonthCategorized
              transactions={selectedChargesThisMonth}
              exchangeRates={exchangeRates}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ThisMonth;
