const initialScreenSize = {
    height: window.innerHeight,
    width: document.getElementById('root').clientWidth
}

export const onScreenResize = (state = initialScreenSize, action = {}) => {
    switch (action.type) {
        case 'CHANGE_WIDTH': return Object.assign({}, state, { width: action.payload });
        case 'CHANGE_HEIGHT': return Object.assign({}, state, { height: action.payload }); 
        default: return state;
    }
}