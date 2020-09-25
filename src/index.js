import "core-js";
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import './assets/styles/style.scss';
import App from './App';
import { onScreenResize } from './reducers';


const store = createStore(onScreenResize),
  rootElement = document.getElementById('root')
  
ReactDOM.render( <Provider store={store}><App /></Provider>, rootElement )
