const React = require('react');
const ReactDOM = require('react-dom');
const { Component } = React;

require('./index.scss');

const socket = io();

class App extends Component {
	constructor() {
		super();

		this.timer = -1;
		this.touchX = 0;
		this.touchY = 0;
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		this.fireClick = this.fireClick.bind(this);
		this.fireDoubleClick = this.fireDoubleClick.bind(this);
		this.moveToAbsoluteCursorPosition = this.moveToAbsoluteCursorPosition.bind(this);
		this.loop = this.loop.bind(this);
		this.state = { base64: '' };

		this.loop();
	}

	loop() {
		fetch('/capture').then((r) => {
			if (r.ok) {
				return r.text();
			}

			throw Error(r.statusText);
		}).then((r) => {
			this.setState({ base64: r }, () => {
				this.timer = setTimeout(this.loop, 1000);
			});
		}).catch((err) => {
			console.error(err);
			this.timer = setTimeout(this.loop, 1000);
		});
	}

	fireClick() {
		socket.emit('click');
	}

	fireDoubleClick() {
		socket.emit('double-click');
	}

	/**
	 * @param {MouseEvent} e
	 */
	moveToAbsoluteCursorPosition(e) {
		const { currentTarget, clientX, clientY } = e;
		const { left, top, width, height } = currentTarget.getBoundingClientRect();

		socket.emit('absolute', {
			nx: (clientX - left) / width,
			ny: (clientY - top) / height
		});
	}

	/**
	 * @param {TouchEvent} e
	 */
	onTouchStart(e) {
		const { clientX, clientY } = e.touches.item(0);

		this.touchX = clientX;
		this.touchY = clientY;
		clearTimeout(this.timer);
	}

	/**
	 * @param {TouchEvent} e
	 */
	onTouchMove(e) {
		const { clientX, clientY } = e.touches.item(0);
		const { touchX, touchY } = this;

		socket.emit('touch', { dx: clientX - touchX, dy: clientY - touchY });
		this.touchX = clientX;
		this.touchY = clientY;
		e.preventDefault();
	}

	/**
	 * @param {TouchEvent} e
	 */
	onTouchEnd(e) {
		e.preventDefault();
		this.loop();
	}

	render() {
		const {
			state: { base64 }
		} = this;

		return (
			<div style={{
				padding: 5,
				boxSizing: 'border-box'
			}}>
				<div style={{
					paddingBottom: 5
				}}>
					<a href='#' onClick={this.fireClick} style={{
						backgroundColor: 'rgb(30, 30, 30)',
						color: 'rgb(212, 212, 212)',
						padding: '4px 8px',
						borderRadius: 4,
						display: 'inline-block',
						textDecoration: 'none',
						marginRight: 5
					}}>
						Click
					</a>
					<a href='#' onClick={this.fireDoubleClick} style={{
						backgroundColor: 'rgb(30, 30, 30)',
						color: 'rgb(212, 212, 212)',
						padding: '4px 8px',
						borderRadius: 4,
						display: 'inline-block',
						textDecoration: 'none'
					}}>
						Double Click
					</a>
				</div>
				<div onTouchStart={this.onTouchStart} onTouchMove={this.onTouchMove} onTouchEnd={this.onTouchEnd} style={{
					backgroundColor: 'rgb(30, 30, 30)',
					borderRadius: 4,
					padding: 8,
					boxSizing: 'border-box',
					height: 'calc(100% - 31px)'
				}}>
					<img src={`data:image/png;base64,${base64}`} onClick={this.moveToAbsoluteCursorPosition} style={{
						display: 'block',
						height: '100%',
						margin: '0 auto'
					}} />
				</div>
			</div>
		);
	}
}

ReactDOM.render(<App />, document.querySelector('main'));