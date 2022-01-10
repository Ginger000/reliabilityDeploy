import { useSpring, animated,config } from '@react-spring/three'
import React, {useState, useRef, useEffect} from 'react';

const HardSurface = ({position, args, color, GSIRatio}) => {
    const mesh = useRef(null);
    useEffect(()=>{
        mesh.current.geometry.translate(0, 1.5, -3)
    },[])
    // let a = 1-GSIRatio/(GSIRatio+1);
    const {hardScale} = useSpring({
        // hardScale:[1, 1, 1-GSIRatio/(GSIRatio+1)],
        hardScale:[1, 1, 1-GSIRatio/(GSIRatio+1)],
        config:{
            duration:1000
        }
    })
    
    return (
        <animated.mesh position={position} ref={mesh} scale={hardScale}>
            <boxBufferGeometry attach="geometry" args={args}  />
            <meshStandardMaterial attach="material" color={color} />
        </animated.mesh>
    )
}

export default HardSurface
