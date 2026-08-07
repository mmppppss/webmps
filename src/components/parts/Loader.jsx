import logo from '/media/cookie2.webp';
export default function LoadingIcon() {
    return (
        <div className="loading-container" style={{ textAlign: "center", padding: "2rem" }}>
			<img className="loader" src={logo} alt=""/>
        </div>
    );
}
