import React, { Component } from "react";
import "./LoadingSpinner.css";

export default class LoadingSpinner extends Component {
  render() {
    return (
      <div className="LoadingSpinner">
        <div className="lds-grid">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    );
  }
}
