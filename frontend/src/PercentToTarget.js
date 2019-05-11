import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { formatAsCurrency } from "./util";
import "./PercentToTarget.css";

const STATUS_GOOD = Symbol("good");
const STATUS_WARNING = Symbol("warning");
const STATUS_BAD = Symbol("bad");

function getStatus(percent, inverted = false) {
  if (!inverted) {
    if (percent > 1.05) {
      return STATUS_GOOD;
    } else if (percent > 0.8) {
      return STATUS_WARNING;
    } else {
      return STATUS_BAD;
    }
  } else {
    if (percent < 0.95) {
      return STATUS_GOOD;
    } else if (percent < 1.2) {
      return STATUS_WARNING;
    } else {
      return STATUS_BAD;
    }
  }
}

class PercentToTarget extends Component {
  static propTypes = {
    actualCurrentVal: PropTypes.number.isRequired, // the actual value right now
    targetVal: PropTypes.number.isRequired, // the target val for the end of the period
    progressThroughPeriod: PropTypes.number.isRequired, // a fraction of how far through the time period we are (e.g. 15/30 days=0.5)
    inverted: PropTypes.bool
  };

  render() {
    const {
      actualCurrentVal,
      targetVal,
      progressThroughPeriod,
      inverted
    } = this.props;
    const currentTarget = targetVal * progressThroughPeriod;
    const percent = actualCurrentVal / currentTarget;
    const percentStr = percent.toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 2
    });
    const status = getStatus(percent, inverted);

    return (
      <div className="PercentToTarget">
        <div className="percentage">
          <div>To Target:</div>
          <div
            className={classNames({
              green: status === STATUS_GOOD,
              yellow: status === STATUS_WARNING,
              red: status === STATUS_BAD
            })}
          >
            {percentStr}
          </div>
          <div
            className={classNames({
              green: status === STATUS_GOOD,
              yellow: status === STATUS_WARNING,
              red: status === STATUS_BAD
            })}
          >
            {formatAsCurrency(actualCurrentVal)} /{" "}
            {formatAsCurrency(currentTarget)}
          </div>
        </div>
        <div className="target">
          <div>Goal: {formatAsCurrency(targetVal)}</div>
        </div>
      </div>
    );
  }
}

export default PercentToTarget;
