import { useSpring, animated,config } from '@react-spring/three'
import React, {useState, useRef, useEffect} from 'react';

const GSIDepth = ({position, args, color, GSIRatio, prevGSIRatio, depth}) => {
    const mesh = useRef(null);
    useEffect(()=>{
        mesh.current.geometry.translate(0, -1.25, 3)
    },[])

    console.log("prevGSIRatio", prevGSIRatio)
    console.log("GSIRatio", GSIRatio)
    const {GSISoilScale} = useSpring({
        
        // GSISoilScale:[1,1,GSIRatio/(GSIRatio+1)],
        GSISoilScale:[1,depth/2.5,GSIRatio/(GSIRatio+1)],
        // delay:prevGSIRatio < GSIRatio ? 2000 : 0 ,
        // delay:2000,
        config:{
            duration:2000
            // duration:prevGSIRatio < GSIRatio ? 2000 : 1000 
            // duration:prevGSIRatio < GSIRatio ? 2000 : 0
        }
    })
    return (
        <animated.mesh position={position} ref={mesh} scale={GSISoilScale}>
            <boxBufferGeometry attach="geometry" args={args}  />
            <meshStandardMaterial attach="material" color={color} />
        </animated.mesh>
    )
}

export default GSIDepth
