import React, { Component } from "react";
import ReactEcharts from "echarts-for-react";
import PropTypes from "prop-types";
import { List } from "immutable";

function getDataset(transactions) {
  return transactions
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
    transactions: PropTypes.instanceOf(List).isRequired
  };

  getOptions = () => {
    const { transactions } = this.props;
    const dataset = getDataset(transactions);

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
          type: "bar",
          label: {
            show: true,
            position: "top"
          }
        }
      ]
    };
  };

  render() {
    return <ReactEcharts option={this.getOptions()} />;
  }
}

export default ThisMonthCategorized;
