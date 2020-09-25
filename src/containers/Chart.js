import React from 'react';
import { connect } from 'react-redux';
import * as d3 from 'd3';
import { queue } from 'd3-queue';
import tippy, { hideAll } from 'tippy.js';
import AppCalendar from './../components/Calendar';
import { resizeWidth, resizeHeight } from '../actions';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';

var mapStateToProps = state => {
    return {
        height: state.height,
        width: state.width
    }
},
    mapDispatchToProps = dispatch => {
        return {
            onScreenWidthChange: (event) => dispatch(resizeWidth(event)),
            onScreenHeightChange: (event) => dispatch(resizeHeight(event))
        }
    };

class AppChart extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            data: []
        };
    }
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
    debounce(fn, ms) {
        let timer
        return _ => {
            clearTimeout(timer)
            if (this.props.width != document.getElementById('root').clientWidth) this.destroyTooltips()
            timer = setTimeout(_ => {
                timer = null
                fn.apply(this, arguments)
            }, ms)
        };
    }
    componentDidMount() {
        var t = this,
            { onScreenWidthChange, onScreenHeightChange } = t.props;

        queue()
            .defer(d3.json, `https://holidayapi.com/v1/holidays?pretty&key=${process.env.REACT_APP_HOLIDAY_API_KEY}&country=US&year=2019`) // a free key for dev purposes can be acquired from holidayapi.com
            .await(function (err, d) {
                if (err) throw err;
                t.setState({ data: d.holidays })
            });
            
        const debouncedHandleResize = t.debounce(function handleResize() {
            var h = window.innerHeight,
                w = document.getElementById('root').clientWidth;
            if (h != t.props.height) onScreenHeightChange(h)
            if (w != t.props.width) onScreenWidthChange(w)
        }, 250)
        window.addEventListener('resize', debouncedHandleResize)
    }
    render() {
        var { data } = this.state;

        if (data.length == 0) return <></>
        else return (
            <main>
                <AppCalendar data={data} />
            </main>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppChart)