import { useState } from "react";
import { useRegisterMutation } from "../generated/graphql";
import {RouteComponentProps} from "react-router-dom";

function Register({ history }: RouteComponentProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [register] = useRegisterMutation();

    return <form onSubmit = {async e => {
        e.preventDefault();
        const response = await register({
            variables: {
                email,
                password
            }
        })
        if (response.data?.register) {
            history.push("/login");
        }
        
    }}>
        <div>
            <input value={email} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
            <input type="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Register</button>
    </form>
}
  
export default Register;