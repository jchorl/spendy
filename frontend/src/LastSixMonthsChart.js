import React, { Component } from "react";
import ReactEcharts from "echarts-for-react";
import PropTypes from "prop-types";
import { List, Map, Set } from "immutable";
import { normalizeToUSD } from "./util";

function getDimensions(transactions) {
  return List(["month"]).concat(
    transactions
      .map(c => c.get("category"))
      .toSet()
      .toList()
  );
}

function getDataset(transactions) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  // a map of category => amount that will be cloned for each month
  const categoryToAmount = transactions
    .map(t => t.get("category"))
    .toSet()
    .reduce(
      (categoryToAmount, category) => categoryToAmount.set(category, 0),
      Map()
    );
  return transactions
    .filter(t => t.get("date") >= sixMonthsAgo)
    .groupBy(
      c => new Date(c.get("date").getFullYear(), c.get("date").getMonth())
    ) // group by month and year
    .map(transactions =>
      transactions
        .groupBy(t => t.get("category")) // group by category
        .map(
          transactionsForCategory =>
            transactionsForCategory.reduce(
              (runningTotal, transaction) =>
                runningTotal + transaction.get("amount"),
              0
            ) // and reduce to a total per-category
        )
    )
    .map(transactionsForCategory =>
      categoryToAmount.merge(transactionsForCategory)
    ) // merge into a map with all categories to ensure all categories are present every month
    .mapEntries(([key, value]) => [key, value.set("month", key)]) // flatten the dates into the values
    .valueSeq()
    .sortBy(r => r.get("month")) // sort by date
    .map(r =>
      r.update("month", d =>
        d.toLocaleString("en-us", { year: "numeric", month: "long" })
      )
    ) // change the date to a readable string
    .toList();
}

class LastSixMonthsChart extends Component {
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
    const normalizedCharges = normalizeToUSD(charges, exchangeRates);
    const dimensions = getDimensions(normalizedCharges);
    const dataset = getDataset(normalizedCharges);

    return {
      legend: {
        data: dimensions.skip(1).toJS(),
        right: "right"
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross"
        }
      },
      xAxis: {
        type: "category",
        name: "Month",
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
        dimensions: dimensions.toJS(),
        source: dataset.toJS()
      },
      series: dimensions
        .skip(1)
        .map((_, idx) => ({
          type: "line",
          stack: true,
          areaStyle: {}
        }))
        .toJS()
    };
  };

  render() {
    return <ReactEcharts option={this.getOptions()} />;
  }
}

export default LastSixMonthsChart;
