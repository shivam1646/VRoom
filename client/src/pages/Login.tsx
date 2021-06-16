import { useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import { setAccessToken } from "../accessToken";
import { useLoginMutation } from "../generated/graphql";

function Login({ history }: RouteComponentProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [login] = useLoginMutation();

    return <form onSubmit = {async e => {
        e.preventDefault();
        const response = await login({
            variables: {
                email,
                password
            }
        })
        if (response && response.data) {
            setAccessToken(response.data.login.accessToken);
            history.push("/dashboard");
        }
        console.log(response);
        
    }}>
        <div>
            <input value={email} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
            <input type="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Login</button>
    </form>
}
  
export default Login;