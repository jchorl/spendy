import React, { Component } from "react";
import ReactEcharts from "echarts-for-react";
import PropTypes from "prop-types";
import { List, Map, Range, Set, fromJS } from "immutable";
import { ACCOUNT_TO_CURRENCY } from "./config";

// a bug in immutable prevents dates from being map values
// https://github.com/immutable-js/immutable-js/issues/1643
// so temporarily work around it using strings
function dayToString(date) {
  return date.toISOString();
}

function getFirstOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getFirstOfNextMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
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
    .groupBy(t =>
      dayToString(
        new Date(
          t.get("date").getFullYear(),
          t.get("date").getMonth(),
          t.get("date").getDate()
        )
      )
    ) // group by date
    .update(dayToString(firstOfMonth), (transactions = List()) => transactions) // make sure the first of month is present
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

class ThisMonthTotal extends Component {
  static propTypes = {
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    transactions: PropTypes.instanceOf(List).isRequired
  };

  // based off https://ecomfe.github.io/echarts-examples/public/editor.html?c=area-stack&theme=dark
  getOptions = () => {
    const { exchangeRates, transactions } = this.props;
    const excludedCategories = Set(["Savings", "Rent"]);
    const charges = transactions
      .filter(t => t.get("amount") > 0) // filter for only expenses
      .filter(t => !excludedCategories.contains(t.get("category")));
    const dataset = getDataset(charges, exchangeRates);
    const yMax = Math.max(dataset.getIn([-1, 1], 450), 450);

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
        min: getFirstOfMonth(),
        max: getFirstOfNextMonth()
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
                  coord: [getFirstOfMonth(), 0]
                },
                {
                  coord: [getFirstOfNextMonth(), 400]
                }
              ]
            ]
          }
        }
      ]
    };
  };

  render() {
    return <ReactEcharts option={this.getOptions()} />;
  }
}

export default ThisMonthTotal;
