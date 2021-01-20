import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import * as d3 from 'd3';
import { interpolatePurples } from 'd3-scale-chromatic';
import tippy, { hideAll } from 'tippy.js';
import Glide from '@glidejs/glide';
import Octicon, { ChevronLeft, ChevronRight } from '@primer/octicons-react'
import AppTooltip from './../components/Tooltip';

var sourceParse = d3.timeParse("%Y-%m-%d"),
    dayFormat = d3.timeFormat("%w"),
    weekFormat = d3.timeFormat("%U"),
    sourceFormat = d3.timeFormat("%Y-%m-%d"),
    fullMonthFormat = d3.timeFormat("%B"),
    spacePaddedDate = d3.timeFormat("%e"),
    weeksInMonth = function (month) {
        var m = d3.timeMonth.floor(month)
        return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m, 1)).length;
    },
    mapStateToProps = state => {
        return {
            height: state.height,
            width: state.width
        }
    };

class AppCalendar extends React.Component {
    lookupData = () => d3.nest()
        .key(function (d) { return d.day; })
        .rollup(function (leaves) {
            return d3.sum(leaves, function (d) { return parseInt(d.holidays.length); });
        })
        .object(this.parseData(this.props.data))
    destroyTooltips(e) {
        if (e) {
            var t = this,
                el = e.target,
                instance = el._tippy;
            if (instance) return
        }
        var t = this,
            sel = '.day',
            el = document.querySelectorAll(sel);

        hideAll()
        if (el.length > 0) {
            for (var i in el) {
                if (el[i] instanceof Element) {
                    var instance = tippy(el[i])

                    instance.disable()
                    instance.destroy()
                    d3.select(instance.popper).remove()

                    el[i].removeEventListener('mouseup', t.createToolTip)
                    d3.select(el[i]).attr("data-selected", false)
                }
            }
        }
    }
    createToolTip = (d) => {
        var t = this,
            el = d3.select(`[data-date="${d}"]`).node(),
            { width, height, data } = t.props,
            isMobile = width <= 650 && height <= 768,
            instance = el._tippy,
            thisDate = new Date(d),
            thisDay = t.parseData(data).filter((el) => {
                return el.day == d
            });

        thisDate.setDate(thisDate.getDate() + 1)
        if (!instance && thisDay[0]) {
            tippy(el, {
                trigger: 'click',
                hideOnClick: false,
                arrow: false,
                theme: 'light-border',
                placement: isMobile ? 'auto' : 'left-start',
                getReferenceClientRect: !isMobile ? null : () => ({
                    width: width - 40,
                    height: 40,
                    left: 20,
                    right: 0,
                    top: height > 650 ? width * .3 : width * .3,
                    bottom: 0,
                }),
                onShow(instance) {
                    d3.select(el).attr("data-selected", true)
                    d3.select(instance.popper).attr('style', 'opacity: 1')
                    hideAll({ exclude: instance })
                    ReactDOM.render(
                        <AppTooltip d={d} instance={instance} dateData={thisDay} />,
                        instance.popper.childNodes[0].childNodes[0])
                },
                onHide(instance) {
                    d3.select(el).attr("data-selected", false)
                    d3.select(instance.popper).attr('style', 'opacity: 0')
                },
                onTrigger(instance, event) {
                    if (d3.select(event.target).attr('data-selected') == 'true') {
                        instance.destroy()
                    }
                },
                onClickOutside(instance, event) {
                    var parent = d3.select('[data-tippy-root]').node(),
                        child = d3.select(event.target).node(),
                        node = child.parentNode;
                    while (node != null) {
                        if (node == parent) return false;
                        node = node.parentNode;
                    }
                    instance.destroy()
                }
            })
        }
    }
    parseData(data) {
        var stats = [];
        data.forEach((element) => {
            var foundDay = stats.some(elem => {
                return elem.day == element.date
            })
            if (foundDay) {
                stats.forEach(elem => {
                    if (element.date === elem.day) {
                        elem.count++
                        var foundHoliday = elem.holidays.some(el => {
                            return el.holiday == element.name
                        })

                        if (!foundHoliday) {
                            elem.holidays.push({
                                holiday: element.name
                            })
                        }
                    }
                })
            }
            else {
                stats.push({
                    day: element.date,
                    count: 1,
                    holidays: [{
                        holiday: element.name
                    }]
                })
            }
        })
        return stats;
    }
    drawCalendar() {
        var t = this,
            selector = "#chart",
            { width } = t.props,
            glide = new Glide('.glide'),
            selWidth = d3.select("#chart-container").node().getBoundingClientRect().width,
            isDesktop = width >= 769,
            daysOfTheWeek = 7,
            columns = isDesktop ? 3 : 1,
            gutter = isDesktop ? 10 : 40,
            cellMargin = (selWidth / columns) / 50,
            cellSize = (((selWidth / daysOfTheWeek) - cellMargin) / columns) - (gutter / 2),
            lastYear = new Date().getFullYear() - 1,
            months = d3.timeMonth.range(sourceParse(`${lastYear}-01-01`), sourceParse(`${lastYear}-12-31`));

        t.destroyTooltips()

        var svg = d3.select(selector)
            .attr("style", null)
            .selectAll("li")
            .data(months)
            .enter().append("li")
            .attr("class", isDesktop ? null : "glide__slide")
            .attr("width", function (d) { return isDesktop ? ((cellSize * daysOfTheWeek) + (cellMargin * daysOfTheWeek) + gutter) : selWidth; })
            .append("svg")
            .attr("class", "month")
            .attr("id", function (d, i) { return "slide-" + i })
            .attr("height", function (d) { return isDesktop ? (cellSize * weeksInMonth(d)) + (cellMargin * 8) + (cellSize / 2) + cellMargin : (cellSize * weeksInMonth(d)) + (cellMargin * 8) + (cellSize / 2) })
            .attr("width", function (d) { return ((cellSize * daysOfTheWeek) + (cellMargin * daysOfTheWeek) + gutter); })
            .attr("style", `margin-bottom: ${cellSize / 4}px; margin-top: ${cellSize / 4}px`)

        svg.append("text")
            .attr("class", "month-name")
            .attr("y", cellSize / 1.5)
            .attr("x", function (d) { return (((cellSize * daysOfTheWeek) + (cellMargin * (daysOfTheWeek))) / 2) + ((cellMargin + gutter) / 2); })
            .attr("text-anchor", "middle")
            .attr("style", `font-size:${cellSize / 1.5}px`)
            .text(function (d) { return fullMonthFormat(d); })

        var rectangle = svg.selectAll("rect.day")
            .data(function (d, i) { return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1)); })
            .enter()

        var rect = rectangle.append("rect")
            .attr("class", "day day--empty")
            .attr("data-selected", false)
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("rx", 3).attr("ry", 3)
            .style("fill", "#e7e7e7")
            .attr("x", function (d) { return (dayFormat(d) * cellSize) + (dayFormat(d) * cellMargin) + ((cellMargin + gutter) / 2); })
            .attr("y", function (d) { return ((weekFormat(d) - weekFormat(new Date(d.getFullYear(), d.getMonth(), 1))) * cellSize) + ((weekFormat(d) - weekFormat(new Date(d.getFullYear(), d.getMonth(), 1))) * cellMargin) + (cellSize + cellMargin / 2); })
            .attr("data-date", function (d) { return sourceFormat(d) })
            .on("mouseup", t.createToolTip)
            .datum(sourceFormat);

        rectangle.append("text")
            .attr("x", function (d) { return (dayFormat(d) * cellSize) + (dayFormat(d) * cellMargin) + (cellSize / 2) + ((cellMargin + gutter) / 2); })
            .attr("y", function (d) { return ((weekFormat(d) - weekFormat(new Date(d.getFullYear(), d.getMonth(), 1))) * cellSize) + ((weekFormat(d) - weekFormat(new Date(d.getFullYear(), d.getMonth(), 1))) * cellMargin) + (cellSize + cellMargin / 2) + (cellSize / 2); })
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("class", "month-day number")
            .attr("style", `font-size:${cellSize / 2}px`)
            .text(function (d) { return spacePaddedDate(new Date(d)) });

        rect.filter(function (d) { return d in t.lookupData(); })
            .style("fill", function (d) { return interpolatePurples(t.lookupData()[d] / 3); })
            .attr("class", "day day--holidays");

        t.rect = rect

        if (!isDesktop) glide.mount()
        else {
            glide.disable()
            d3.select('#slideshow').attr("style", null)
            glide.destroy()
        }
    }
    componentDidUpdate(prevprops) {
        var { width } = this.props;
        if (prevprops.width != width) {
            d3.select("#chart").html("")
            this.drawCalendar()
        }
    }
    componentDidMount() {
        this.drawCalendar()
    }
    render() {
        var isMobile = this.props.width <= 768
        return (
            <div id="slideshow" className={isMobile ? "glide" : null}>
                <div id="chart-container" className={isMobile ? "glide__track" : null} data-glide-el={isMobile ? "track" : null}>
                    <ul className={isMobile ? "glide__slides" : null} id="chart">
                    </ul>
                </div>

                <div className="glide__arrows" data-glide-el="controls">
                    <button className="glide__arrow glide__arrow--left" data-glide-dir="<">
                        <Octicon icon={ChevronLeft} />
                    </button>
                    <button className="glide__arrow glide__arrow--right" data-glide-dir=">">
                        <Octicon icon={ChevronRight} />
                    </button>
                </div>
            </div>
        )
    }
}

export default connect(mapStateToProps)(AppCalendar)