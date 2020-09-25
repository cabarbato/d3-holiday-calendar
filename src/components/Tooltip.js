import React from 'react';
import * as d3 from 'd3';
import { hideAll } from 'tippy.js';
import Octicon, { X } from '@primer/octicons-react'

export default class AppTooltip extends React.Component {
    hideTippy() {
        d3.selectAll("rect.day").attr("data-selected", false)
        hideAll()
    }
    getholidays(data) {
        var tiphtml = []
        for (var i in data.holidays) {
            var holiday = data.holidays[i];
            tiphtml.push(
                <div className={`holidays--holiday holiday-${i}`} key={i}>
                    <h3 className="holidays--holiday-name">
                        {holiday.holiday}
                    </h3>
                </div>
            )
        }
        return tiphtml
    }
    render() {
        var t = this,
            { d, dateData } = t.props,
            shortMonthFormat = d3.timeFormat("%b"),
            spacePaddedDate = d3.timeFormat("%e"),
            thisDate = new Date(d),
            thisDay = dateData.filter((el) => {
                return el.day == d
            });

        thisDate.setDate(thisDate.getDate() + 1)

        return (
            <div className={`holidays holidays-for-${d}`}>
                <div className="holidays--exit" onClick={t.hideTippy}>
                    <Octicon icon={X} />
                </div>
                <div className="holidays--date">
                    <h4 className="holidays--date-month">{shortMonthFormat(thisDate)}</h4>
                    <h3 className="holidays--date-day number">{spacePaddedDate(thisDate)}</h3>
                </div>
                <div className="holidays--container">
                    {t.getholidays(thisDay[0])}
                </div>
            </div>
        )
    }
}