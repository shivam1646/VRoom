import { Link } from "react-router-dom";

function LandingPage() {
    return <div>
        <div><Link to="/register">Register</Link></div>
        <div><Link to="/login">Login</Link></div>
        <div><Link to="/dashboard">Dashboard</Link></div>
    </div>
}
  
export default LandingPage;