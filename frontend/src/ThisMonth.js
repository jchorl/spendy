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

function getSeries(transactions, exchangeRates) {
  const now = new Date();
  // TODO instead of range, use month to date
  // probably split into two charts, total spending line and categorized bar chart
  // total spend will have a goal line on it
  // also only include categories that we can actually cut down on (restaurants, travel, clothing, entertainment, etc)
  const dates = Range(30, 0, -1).map(
    n => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n)
  ); // transform to stream of dates

  const oldest = dates.get(0);

  // construct a map of (date => total)
  // this map will be cloned for each category
  const datesToTotal = dates.reduce(
    (map, date) => map.set(dayToString(date), 0),
    Map()
  );

  return transactions
    .filter(t => t.get("date") >= oldest) // only dates within range
    .map(t =>
      t.update(
        "amount",
        amount =>
          amount / exchangeRates.get(ACCOUNT_TO_CURRENCY[t.get("account")])
      )
    ) // normalize to USD
    .groupBy(t => t.get("category"))
    .map(
      transactionsForCategory =>
        transactionsForCategory
          .groupBy(c =>
            dayToString(
              new Date(
                c.get("date").getFullYear(),
                c.get("date").getMonth(),
                c.get("date").getDate()
              )
            )
          ) // group by date
          .map(transactionsForDate =>
            transactionsForDate.reduce(
              (total, transaction) => total + transaction.get("amount"),
              0
            )
          ) // get total for each date
    )
    .map(
      dateToAmount =>
        dateToAmount
          .reduce(
            (allDatesToAmounts, amount, dateStr) =>
              allDatesToAmounts.update(dateStr, curr => curr + amount),
            datesToTotal
          ) // ensure that there is a date entry for every date being considered
          .map((total, dateStr) => List([dateStr, total])) // flatten dates into values
          .valueSeq()
          .sortBy(e => e.get(0)) // sort by the date
          .reduce(
            (list, entry) =>
              list.isEmpty()
                ? list.push(entry) // if its the first entry, just put it in the new list
                : list.push(
                    entry.update(1, thatDay => thatDay + list.getIn([-1, 1]))
                  ), // otherwise add the current amount to the previous amount (-1 is the last entry, 1 is the price)
            List()
          ) // roll up the costs per category
    ) // now the map is category => sorted list of (date, total to date)
    .map((totalByDate, category) =>
      Map({
        name: category,
        data: totalByDate,
        type: "line",
        stack: true,
        areaStyle: {}
      })
    ) // convert to the actual series
    .valueSeq(); // and just take the values because the map is keyed by category
}

class ThisMonth extends Component {
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
    const series = getSeries(charges, exchangeRates);

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
        nameGap: 30
      },
      yAxis: {
        name: "$ (USD)",
        nameLocation: "center",
        type: "value",
        nameGap: 40
      },
      series: series.toJS()
    };
  };

  render() {
    return <ReactEcharts option={this.getOptions()} />;
  }
}

export default ThisMonth;
