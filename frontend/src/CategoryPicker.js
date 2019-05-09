import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Set } from "immutable";
import "./CategoryPicker.css";

class CategoryPicker extends Component {
  static propTypes = {
    categories: PropTypes.instanceOf(Set).isRequired,
    selected: PropTypes.instanceOf(Set).isRequired,
    onToggle: PropTypes.func
  };

  onToggle = category => () => {
    const { onToggle } = this.props;
    if (!!onToggle) {
      onToggle(category);
    }
  };

  render() {
    const { categories, selected } = this.props;

    return (
      <div className="CategoryPicker">
        {categories.map(c => (
          <div
            key={c}
            className={classNames("category", {
              selected: selected.contains(c)
            })}
            onClick={this.onToggle(c)}
          >
            {c}
          </div>
        ))}
      </div>
    );
  }
}

export default CategoryPicker;
