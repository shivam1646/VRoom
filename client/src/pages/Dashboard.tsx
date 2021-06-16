import { RouteComponentProps } from "react-router-dom";
import { setAccessToken } from "../accessToken";
import { useHomeQuery, useLogoutMutation } from "../generated/graphql";

function Dashboard({ history }: RouteComponentProps) {
    const {data, loading, error} = useHomeQuery({fetchPolicy: "network-only"});
    const [logout] = useLogoutMutation();
    if (loading) {
        return <div>Loading...</div>
    }

    if (error) {
        console.log(error);
        return <div>error</div>
    }

    if (!data) {
        return <div>no data</div>
    }

    return <div>
            {data.home}
            <button onClick={async () => {
                await logout();
                await setAccessToken("");
                history.push("/");
            }}>log out</button>
        </div>
}
  
export default Dashboard;