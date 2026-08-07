export default function Footer() {
	const ccstyle = {
		"maxWidth": "1em",
		"maxHeight": "1em",
		"marginLeft": ".2em"
	};
	return (
		<footer className="footer" style={{ "textAlign": "center", justifyContent: "center" }}>
			<a href="https://mpps.qzz.io"> </a>
			<span> © 2025 by </span>
			<a href="https://github.com/mmppppss">mmppppss</a>
			<span> is licensed under </span>
			<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>

			<img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" style={ccstyle} alt="Creative Commons" />

			<img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" style={ccstyle} alt="Creative Commons" />
		</footer>
	)
}
