import React, { Component } from "react";
import ReactEcharts from "echarts-for-react";
import PropTypes from "prop-types";
import { List } from "immutable";
import { getFirstOfYear, getFirstOfNextYear } from "./util";

// a bug in immutable prevents dates from being map values
// https://github.com/immutable-js/immutable-js/issues/1643
// so temporarily work around it using strings
function dayToString(date) {
  return date.toISOString();
}

function getDataset(transactions) {
  return transactions
    .groupBy(t =>
      dayToString(
        new Date(
          t.get("date").getFullYear(),
          t.get("date").getMonth(),
          t.get("date").getDate()
        )
      )
    ) // group by date
    .update(
      dayToString(getFirstOfYear()),
      (transactions = List()) => transactions
    ) // make sure the first of year is present
    .map(transactionsForDate =>
      transactionsForDate.reduce(
        (total, transaction) => (total += transaction.get("amount")),
        0
      )
    ) // reduce to total by date
    .map((totalForDate, date) => List([date, totalForDate])) // fold the date in
    .valueSeq() // grab the [date, total] pairs
    .sortBy(pair => pair.get(0)) // sort by date
    .reduce(
      (runningTotals, pair) =>
        runningTotals.push(
          pair.update(1, thatDay => thatDay + runningTotals.getIn([-1, 1], 0)) // add current day to running total (or 0 if there is no running total)
        ),
      List()
    ); // roll up
}

class AnnualChart extends Component {
  static propTypes = {
    goal: PropTypes.number.isRequired,
    transactions: PropTypes.instanceOf(List).isRequired
  };

  getOptions = () => {
    const { goal, transactions } = this.props;
    const firstOfYear = getFirstOfYear();
    const firstOfNextYear = getFirstOfNextYear();

    const total = transactions.reduce(
      (runningTotal, t) => runningTotal + t.get("amount"),
      0
    );
    const dataset = getDataset(transactions);
    const yMax = Math.max(dataset.getIn([-1, 1], goal + 1000), goal + 1000);

    return {
      legend: {},
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross"
        }
      },
      xAxis: {
        type: "time",
        name: "Date",
        nameLocation: "center",
        nameGap: 30,
        min: firstOfYear,
        max: firstOfNextYear
      },
      yAxis: {
        name: "$ (USD)",
        nameLocation: "center",
        type: "value",
        nameGap: 40,
        max: yMax
      },
      dataset: {
        source: dataset.toJS()
      },
      series: [
        {
          type: "line",
          markLine: {
            data: [
              [
                {
                  name: "Target",
                  coord: [firstOfYear, 0]
                },
                {
                  coord: [firstOfNextYear, goal]
                }
              ]
            ]
          }
        },
        {
          type: "line",
          data: [[dayToString(new Date()), total]],
          symbol: "diamond",
          symbolSize: 14,
          label: {
            show: true,
            position: "top",
            formatter: "Current: ${@[1]}" // eslint-disable-line no-template-curly-in-string
          }
        }
      ]
    };
  };

  render() {
    return <ReactEcharts option={this.getOptions()} />;
  }
}

export default AnnualChart;
