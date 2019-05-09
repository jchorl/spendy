import React, { Component } from "react";
import ReactEcharts from "echarts-for-react";
import PropTypes from "prop-types";
import { List, Map } from "immutable";
import { ACCOUNT_TO_CURRENCY } from "./config";

function getDataset(transactions, exchangeRates) {
  return transactions
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
    const dataset = getDataset(transactions, exchangeRates);

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
