import React, { Component } from "react";
import { fromJS } from "immutable";
import LastSixMonthsChart from "./LastSixMonthsChart";
import Savings from "./Savings";
import ThisMonthTotal from "./ThisMonthTotal";
import ThisMonthCategorized from "./ThisMonthCategorized";
import LoadingSpinner from "./LoadingSpinner";
import "./App.css";

class App extends Component {
  state = {
    rates: null,
    transactions: null
  };

  componentWillMount() {
    fetch("https://api.exchangeratesapi.io/latest?base=USD")
      .then(resp => resp.json())
      .then(({ rates }) =>
        this.setState({ rates: fromJS(rates).set("USD", 1) })
      );

    const chargesSearchParams = new URLSearchParams();
    chargesSearchParams.set("days", 365);
    fetch(`/api/charges?${chargesSearchParams.toString()}`)
      .then(resp => resp.json())
      .then(transactions =>
        this.setState({
          transactions: fromJS(transactions).map(t =>
            t.update("date", d => new Date(d))
          )
        })
      );
  }

  render() {
    const { rates, transactions } = this.state;
    if (!rates || !transactions) {
      return (
        <div className="App">
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div className="App">
        <h1>This Month</h1>
        <div className="thisMonth">
          <div className="half">
            <ThisMonthTotal transactions={transactions} exchangeRates={rates} />
          </div>
          <div className="half">
            <ThisMonthCategorized
              transactions={transactions}
              exchangeRates={rates}
            />
          </div>
        </div>
        <h1>Savings</h1>
        <Savings transactions={transactions} exchangeRates={rates} />
        <h1>Last 6 Months</h1>
        <LastSixMonthsChart transactions={transactions} exchangeRates={rates} />
      </div>
    );
  }
}

export default App;
