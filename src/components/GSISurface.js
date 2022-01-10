import { useSpring, animated,config } from '@react-spring/three'
import React, {useState, useRef, useEffect} from 'react';

const GSISurface = ({position, args, color, GSIRatio, prevGSIRatio}) => {
    const mesh = useRef(null);
    useEffect(()=>{
        mesh.current.geometry.translate(0, 1.5, 3)
    },[])
    // let a = (GSIRatio/(GSIRatio+1)).toFixed(2)
    const {GSIScale} = useSpring({

        // GSIScale:[1,1,GSIRatio/(GSIRatio+1)],
        GSIScale:[1,1,GSIRatio/(GSIRatio+1)],
        // delay:prevGSIRatio < GSIRatio ? 2000 : 0 ,
        config:{
            duration:2000
            // duration:prevGSIRatio < GSIRatio ? 2000 : 0 
        }
    })
    return (
        <animated.mesh position={position} ref={mesh} scale={GSIScale}>
            <boxBufferGeometry attach="geometry" args={args}  />
            <meshStandardMaterial attach="material" color={color} />
        </animated.mesh>
    )
}

export default GSISurface
