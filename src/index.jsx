const React = require('react');
const ReactDOM = require('react-dom');
const { Component } = React;

const socket = io('http://localhost:3000');

socket.emit('touch', { dx: 0, dy: 0 });

class App extends Component {
	constructor() {
		super();

		this.state = {
			x: 0,
			y: 0
		};

		socket.on('cursor', ({ x, y }) => {
			this.setState({ x, y });
		});
	}

	render() {
		const { state: { x, y } } = this;

		return (
			<div style={{ position: 'relative' }}>
				<img src='../cursor.png' style={{
					display: 'block',
					position: 'absolute',
					left: x,
					top: y
				}} />
			</div>
		);
	}
}

ReactDOM.render(<App />, document.querySelector('main'));