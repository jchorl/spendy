import React, { Component } from "react";
import ReactEcharts from "echarts-for-react";
import PropTypes from "prop-types";
import { List, Map, Set } from "immutable";
import { ACCOUNT_TO_CURRENCY } from "./config";

function getFirstOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getDataset(transactions, exchangeRates) {
  const firstOfMonth = getFirstOfMonth();
  return transactions
    .filter(t => t.get("date") >= firstOfMonth) // only dates within range
    .map(t =>
      t.update(
        "amount",
        amount =>
          amount / exchangeRates.get(ACCOUNT_TO_CURRENCY[t.get("account")])
      )
    ) // normalize to USD
    .groupBy(t => t.get("category")) // group by category
    .map(transactionsForCategory =>
      transactionsForCategory.reduce(
        (total, transaction) => (total += transaction.get("amount")),
        0
      )
    ) // reduce to total by category
    .map((totalForCategory, category) => List([category, totalForCategory])) // fold the date in
    .valueSeq(); // grab the [category, total] pairs
}

class ThisMonthCategorized extends Component {
  static propTypes = {
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    transactions: PropTypes.instanceOf(List).isRequired
  };

  getOptions = () => {
    const { exchangeRates, transactions } = this.props;
    const excludedCategories = Set(["Savings", "Rent"]);
    const charges = transactions
      .filter(t => t.get("amount") > 0) // filter for only expenses
      .filter(t => !excludedCategories.contains(t.get("category")));
    const dataset = getDataset(charges, exchangeRates);

    return {
      legend: {},
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross"
        }
      },
      xAxis: {
        type: "category",
        name: "Category",
        nameLocation: "center",
        nameGap: 30
      },
      yAxis: {
        name: "$ (USD)",
        nameLocation: "center",
        type: "value",
        nameGap: 40
      },
      dataset: {
        source: dataset.toJS()
      },
      series: [
        {
          type: "bar"
        }
      ]
    };
  };

  render() {
    return <ReactEcharts option={this.getOptions()} />;
  }
}

export default ThisMonthCategorized;
