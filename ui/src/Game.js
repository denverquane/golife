import React, {Component} from 'react';
import './Game.css';

import {CANVAS_BASE_HEIGHT, CANVAS_BASE_WIDTH} from './App';

const ALIVE = 0x00000001;

export default class Game extends Component {
    lastTime;

    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
        this.state = {
            mouseCellX: 0,
            mouseCellY: 0,
            width: 0,
            height: 0,
            currentRLE: null,
            mouseInCanvas: false,
        }
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseLeave = this.onMouseLeave.bind(this)
        this.onMouseEnter = this.onMouseEnter.bind(this)
    }

    componentDidMount() {
        const canvas = this.canvasRef.current;
        canvas.style.cursor = 'not-allowed';
        const context = canvas.getContext('2d');
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    equal(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false
        }
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false
            }
        }
        return true
    }

    onMouseMove(event) {
        let x = event.nativeEvent.offsetX;
        let y = event.nativeEvent.offsetY;
        let cellX = Math.floor(x / ((this.state.width + CANVAS_BASE_WIDTH) / this.state.width))
        let cellY = Math.floor(y / ((this.state.height + CANVAS_BASE_HEIGHT) / this.state.height))

        if (cellX !== this.state.mouseCellX || cellY !== this.state.mouseCellY) {
            this.setState({mouseCellX: cellX, mouseCellY: cellY})
        }
    }

    onMouseLeave(event) {
        this.setState({mouseInCanvas: false})
    }

    onMouseEnter(event) {
        this.setState({mouseInCanvas: true})
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.width !== this.state.width || this.props.height !== this.state.height) {
            this.setState({width: this.props.width, height: this.props.height})
        }
        if ((!this.props.currentRLE && prevProps.currentRLE)
            || this.props.currentRLE
            && (!prevProps.currentRLE || prevProps.currentRLE.getName() !== this.props.currentRLE.getName())) {
            this.setState({currentRLE: this.props.currentRLE})
        }


        if (this.props.paused !== prevProps.paused
            || this.props.tick !== prevProps.tick
            || !this.equal(this.props.boardData, prevProps.boardData)
            || ((this.state.mouseCellX !== prevState.mouseCellX
                || this.state.mouseCellY !== prevState.mouseCellY
                || this.state.mouseInCanvas !== prevState.mouseInCanvas) && this.state.currentRLE && this.props.paused)) {
            //console.log("Time since last data: " + (Date.now()-this.lastTime))
            console.log("Updating canvas")
            this.lastTime = Date.now();
            const canvas = this.canvasRef.current;
            if (this.props.paused !== prevProps.paused) {
                if (!this.props.paused) {
                    canvas.style.cursor = 'not-allowed';
                } else {
                    canvas.style.cursor = 'crosshair';
                }
            }
            const context = canvas.getContext('2d');
            context.fillRect(0, 0, canvas.width, canvas.height);
            let cWidth = canvas.width / this.props.width;
            let cHeight = canvas.height / this.props.height;
            let y = 0;
            let x = 0;
            for (let i = 0; i < this.props.boardData.length; i++) {
                let cell = this.props.boardData[i];
                if ((cell & ALIVE) === 1) {
                    //this is so dumb; fighting JS' unsigned integer stupidity
                    console.log("Alive at " + y + "," + x)
                    let r = ((cell >> 8) & (0x000000FF << 16)) >> 16;
                    let g = ((cell >> 8) & (0x000000FF << 8)) >> 8;
                    let b = (cell >> 8) & 0x000000FF;
                    context.fillStyle = 'rgb(' + r + ', ' + g + ',' + b + ',1.0)';
                    context.fillRect(x * cWidth, y * cHeight, cWidth - 1, cHeight - 1);
                } else {
                    //get the lowest 7 bits that aren't the bits for aliveness
                    let rleDeadCells = (cell & 0x000000FE) >> 1
                    //console.log(rleDeadCells)
                    if (rleDeadCells > 1) {
                        x += rleDeadCells;
                    }

                }
                x++;
                if (x >= this.props.width) {
                    y++;
                    x = 0;
                }
            }
            // for (let y = 0; y < this.props.height; y++) {
            //     for (let x = 0; x < this.props.width; x++) {
            //
            //         elemIndex++;
            //
            //     }
            // }
            context.fillStyle = "#000000";
            if (this.state.mouseInCanvas && this.state.currentRLE && this.props.paused) {
                let r = (this.props.color >> 24) & 0xFF;
                let g = (this.props.color >> 16) & 0xFF;
                let b = (this.props.color >> 8) & 0xFF;
                context.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')'
                let idx = 0;
                let data = this.state.currentRLE.getData();
                for (let y = this.state.mouseCellY; y < this.state.mouseCellY + this.state.currentRLE.getHeight(); y++) {
                    for (let x = this.state.mouseCellX; x < this.state.mouseCellX + this.state.currentRLE.getWidth(); x++) {
                        if (data[idx]) {
                            context.fillRect(x * cWidth, y * cHeight, cWidth - 1, cHeight - 1);
                        }
                        idx++
                    }
                }
            }
            context.fillStyle = "#000000";
            let timeToDraw = Date.now() - this.lastTime;
            console.log(timeToDraw)
        }
    }

    render() {
        return (
            <div className="Game">
                <canvas width={this.props.canvasWidth} height={this.props.canvasHeight} ref={this.canvasRef}
                        onClick={this.props.onClick} onMouseLeave={this.onMouseLeave} onMouseEnter={this.onMouseEnter}
                        onMouseMove={this.onMouseMove}></canvas>
                Tick: {this.props.tick}
            </div>
        );
    }
}