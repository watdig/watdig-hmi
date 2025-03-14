import React from "react";
import StateBanner from "../components/StateBanner/stateBanner";
import PowerControl from "../components/TBM Model/tbm related/powercontrol";


const TbmMonitor = () => {

    return (
        <div>
            <div>
                <StateBanner/>
            </div>
            <div>
                <PowerControl/>
            </div>
        </div>
    )
};
export default TbmMonitor;