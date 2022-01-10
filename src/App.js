import "./App.css"
import * as THREE from "three";
import { BoxHelper, CameraHelper } from "three";
import { useSpring, animated,config } from '@react-spring/three'

import HardSurface from "./components/HardSurface";
import GSIDepth from "./components/GSIDepth";
import GSISurface from "./components/GSISurface";
import MySlider from "./components/MySlider";
import React, {useState, useRef, useEffect, useLayoutEffect} from 'react';
import { Canvas, useFrame, useResource } from "@react-three/fiber";
import {Icosahedron, OrthographicCamera, OrbitControls, useHelper} from '@react-three/drei'
import test from "./testData.js"
import DATA from "./Data.js"
import feedbackSearchData from "./feedbackSearchData.json"
import { Button, Box, Alert} from "@mui/material";
import { AxesHelper } from "three";

const BoxLand = ({position, args, color, GSIRatio, height, type}) => {
  const mesh = useRef(null);
  useEffect(()=>{
    mesh.current.geometry.translate(0, 1.5, -3)
  },[])
  let a = 1-GSIRatio/(GSIRatio+1);
  const {hardScale,GSIScale,soilScale} = useSpring({
    hardScale:[1, 1, a],
    GSIScale:[1,1,GSIRatio],
    soilScale:[1,height,GSIRatio],
    config:{duration:1000}
  })

  const hash = {
    "hard":hardScale,
    "GSI":GSIScale,
    "soil":soilScale
  }

  return (
    
    <animated.mesh position={position} ref={mesh} scale={hash[type]}>
      <boxBufferGeometry attach="geometry" args={args}  />
      <meshStandardMaterial attach="material" color={color} />
    </animated.mesh>
   
  )
}



const App = () => {
  const [reduction, setReduction] = useState(40);
  const [duration, setDuration] = useState(2);
  const [soilType, setSoilType] = useState(1);
  const [designStorm, setDesignStorm] = useState(1);
  const [surfaceType, setSurfaceType] = useState(0);
  // const startDepth = [];
  // const startLoadingRatio = []
  const [startDepth, setStartDepth] = useState([]);
  const [startLoadingRatio, setStartLoadingRatio] = useState([]);
  const [depth, setDepth] = useState(0);
  const [loadingRatio, setLoadingRatio] = useState(0);
  const [scenarios, setScenarios] = useState([]);
  const [feedbackScenarios, setFeedbackScenarios] = useState([])
  const [depthTitle, setDepthTitle] = useState("Depth")
  const [ratioTitle, setRatioTitle] = useState("Loading Ratio")
  const [designStormTitle, setDesignStormTitle] = useState("Design Storm")
  const [isDelay, setIsDelay] = useState(true)

  const prevLoadingRatio = useRef();

  useEffect(()=>{
    prevLoadingRatio.current = loadingRatio;
  },[loadingRatio])
 
  
  // const prevDepth = prevDepthRef.current

  //Feedback and limitation changes every time either depth changes or ratio changes

  const firstUpdate = useRef(true);
  useEffect(()=>{
    if(firstUpdate.current){
      firstUpdate.current = false;
      return
    }
    generateOutputSlider(scenarios);
  }, [scenarios])

  useEffect(()=>{
    checkLimitation(depth, loadingRatio, "depth", "loadingRatio")
    checkLimitation(loadingRatio, depth, "loadingRatio", "depth")
    //this probably needs call back. 
    //we need to wait the checkLimitation finishes and than give recommendation
    //&& f["designStorm"] > designStorm
    recommendDesignStorm(depth, loadingRatio, soilType, duration, surfaceType, reduction)
  },[depth, loadingRatio])

  useEffect(()=>{
    console.log(feedbackScenarios)
    stormRecommendation(feedbackScenarios)
  }, [feedbackScenarios])
  
  const stormRecommendation = (feedbackScenarios) =>{
  
    if(feedbackScenarios.length !== 0) {
      const lowerBound = feedbackScenarios[0]["designStorm"]
      console.log("lowerBound",lowerBound)
      if(feedbackScenarios[feedbackScenarios.length-1]["designStorm"] > lowerBound) {
        const upperBound = feedbackScenarios[feedbackScenarios.length-1]["designStorm"]
        console.log("upperBound",upperBound)
        setDesignStormTitle(
          <div>
              Design Storm
              <Alert variant="outlined" severity="info" > 
                You could adjust the design storm within the range {lowerBound} inches to {upperBound} inches
              </Alert> 
          </div>
        )
      } else {
        setDesignStormTitle("Design Storm")
      }
      
    } else {
      setDesignStormTitle("Design Storm")
    }
    console.log("finish recommendation")
  }

  const checkLimitation = (changed, controlled, changedStr, controlledStr)=>{
    let tempScope = []
    //push to sorted array, binary search and use splice to insert
    for(let s of scenarios) {
      if(s[controlledStr] === controlled){
        let left = 0;
        let right = tempScope.length - 1;
        let mid;
        let target = s[changedStr]
        
        while(left <= right){
          mid = Math.floor((left + right)/2)
          if(target === tempScope[mid]) tempScope.splice(mid, 0, target)
          if(target < tempScope[mid]) right = mid - 1;
          if(target > tempScope[mid]) left = mid + 1;
        }
        tempScope.splice(left, 0, target)
      }
    }
    console.log("tempScope",tempScope)
 
    if(changed < tempScope[0]) {
      if(changedStr === "depth") {
        changeDepth2(tempScope[0]);
        setDepthTitle(
          <div>
            Depth
            <Alert variant="outlined" severity="warning" > 
              The {changedStr} cannot be smaller than {tempScope[0]} inches in terms of your inputs and current loading ratio 
            </Alert> 
          </div>
        )
      }
      if(changedStr==="loadingRatio"){
        changeRatio2(tempScope[0]);
        setRatioTitle(
          <div>
            Loading Ratio
            <Alert variant="outlined" severity="warning" > 
              The {changedStr} cannot be smaller than {tempScope[0]} in terms of your inputs and current GSI depth
            </Alert> 
          </div>
        )
      }
      
    } else if (changed > tempScope[0] || tempScope.length === 0){
      if(changedStr === "depth"){
        setDepthTitle("Depth")

      }
      if(changedStr==="loadingRatio"){
        setRatioTitle("Loading Ratio")
        
      }
    }
  }

  const recommendDesignStorm = (depth, loadingRatio, soilType, duration, surfaceType, reduction)=>{
    setFeedbackScenarios(
      feedbackSearchData.filter(f=>f["depth"] === depth 
            && f["loadingRatio"] === loadingRatio && f["reliability"] === 1 
            && f["soilType"] === soilType
            && f["duration"] === duration 
            && f["surface"] === surfaceType
            && f["reduction"] === reduction).sort((a,b)=>a["designStorm"] - b["designStorm"])
    )
  }

  const changeReduction =(evt, value)=>{
    setReduction(value);
    // console.log("reduction ",value);
  }
  const changeDuration = (evt, value)=>{
    setDuration(value);
    // console.log("duration ", value);
  }
  const changeSoilType = (evt, value)=>{
    setSoilType(value);
    // console.log("soilType ", value);
  }
  const changeDesignStorm = (evt, value)=>{
    setDesignStorm(value);
    // console.log("designStorm ", value);
  }
  const changeSurfaceType = (evt, value)=>{
    setSurfaceType(value);
    // console.log("surfaceType ", value);
  }

  //this is to make slider a controlled slider
  const changeDepth = (evt, value)=>{
    setDepth(value);
    console.log("Depth ", value);
    // if(value)
  }
  //this is to change depth slider value directly
  const changeDepth2 = (value)=>{
    setDepth(value);
    console.log("Depth ", value);
    // if(value)
  }

  const changeRatio = (evt, value)=>{
    setLoadingRatio(value);
    console.log("loadingRatio ", value);
  }

  const changeRatio2 = (value)=>{
    setLoadingRatio(value);
  }
  
  const depthUnit = {
    12:1,
    18:1.5,
    24:2,
    30:2.5
  }

  const generateScenarios = (duration, soilType, designStorm, surfaceType) => {
    const scenarioArr = DATA[surfaceType][soilType][duration];
    //pick all the reliablity === 1 scenarios that fit the input context
    setScenarios(scenarioArr.filter(s=>s["designStorm"] === designStorm && s["reliability"] === 1));
    console.log("this is all generated scenarios",scenarios);
    
  }

  const generateOutputSlider = (scenarios) => {
    // sort loadingRatio (ascending) & then depth (ascending)
    //actually we don't have to sort it since our orignal data set is sorted
    scenarios.sort((a,b)=>{
      if(a.loadingRatio === b.loadingRatio){
        return a.depth - b.depth
      }
      return a.loadingRatio-b.loadingRatio
    });
    console.log(scenarios);
    // console.log("old Depth ",startDepth);
    // console.log("old Ratio ",startLoadingRatio);

    setStartDepth([scenarios[0]["depth"]]);
    setDepthTitle("Depth")
    setRatioTitle("Loading Ratio")
    console.log('hslkjfdljsflg')
    setStartLoadingRatio([scenarios[0]["loadingRatio"]])
    setDepth(scenarios[0]["depth"])
    setLoadingRatio(scenarios[0]["loadingRatio"])

    // console.log("new Depth " ,startDepth);
    // console.log("new Ratio" ,startLoadingRatio);
  }

  
  
  

  return (
    
    <div className="view">
      <div className="leftControlPanel">
        <MySlider title="Reduction Amount" min={40} max={80} step={null} marks={[{value: 40,label: '40%'},{value: 80,label: '80%'}]} onChange={changeReduction} defaultVal={40}/>
        <MySlider title="Duration" min={2} max={24} step={null} marks={[{value: 2,label: '2hrs'},{value: 24,label: '24hrs'}]} onChange={changeDuration} defaultVal={2} />
        <MySlider title="Soil Type" min={1} max={3} step={null} marks={[{value: 1,label: 'Fine'},{value: 2,label: 'Mix'},{value: 3,label: 'corase'}]} onChange={changeSoilType} defaultVal={1} />
        <MySlider title={designStormTitle} min={0} max={5} step={0.1} marks={[{value: 0,label: "0"},{value: 1,label: "1"},{value: 2,label: '2'},{value: 3,label: '3'},{value: 4,label: '4'},{value: 5,label: '5'}]} onChange={changeDesignStorm} defaultVal={0} />
        <MySlider title="Surface Type" min={0} max={1} step={null} marks={[{value: 0,label: "Planted"},{value: 1,label: 'Paved'}]} onChange={changeSurfaceType} defaultVal={0} />
        {/* onClick={generate} */}
        {/* onClick={generate(duration, soilType, designStorm, surfaceType)} */}
        <Button sx={{ml: 4, mt:4 }} variant="contained" onClick={()=>generateScenarios(duration, soilType, designStorm, surfaceType)} >GENERATE</Button>
        <Box  sx={{
        
          mt:4 ,
          width: 500,
          height: 300,
          // border: '1px dashed grey'
        }}>
        {console.log("prevGSIRatio", prevLoadingRatio)}
        {console.log("loadingRatio", loadingRatio)}
          {console.log("check Depth ",startDepth)}
          {console.log("current depth", depth)}
          {startDepth.map((d)=>{
              console.log("runned");
              console.log(d)
              //???The point is that I didn't add return?
              return(
              <MySlider key={d} title= {depthTitle} min={12} max={30} step={null} marks={[{value: 12,label: "12"},{value: 18,label: '18'},{value: 24,label: '24'},{value: 30,label: '30'}]} onChange={changeDepth} defaultVal={d} value={depth} />
              )
          })}
          {console.log("check Ratio ",startLoadingRatio)}
          {console.log("current ratio", loadingRatio)}
          {startLoadingRatio.map((l)=>{
            console.log("runned2");
            console.log(l)
            return(
              <MySlider key={l} title={ratioTitle} min={0} max={1} step={null} marks={[{value: 0,label: "0"},{value: 0.125,label: "0.125"},{value: 0.16,label: '0.16'},{value: 0.2,label: '0.2'},{value: 0.33,label: '0.33'},{value: 0.5,label: '0.5'},{value: 1,label: '1'}]} onChange={changeRatio} defaultVal={l} value={loadingRatio} />
            )
          })}
        </Box>

      </div>
      {/* {test[0][1][2]}
      {DATA[0][3][2][0]["depth"]} */}
      {/* {console.log(feedbackSearchData)} */}
      <div className="right3dPanel">
        <Canvas colorManagement  >
          
          <OrthographicCamera makeDefault position={[10, 5, -3]} zoom={60} />

          <ambientLight intensity={0.3} />
          <directionalLight position={[-8, 8, -5]} castShadow intensity={1} shadow-camera-far={70} />
          {/* <axesHelper args={[10]} /> */}
          <group position={[0, 0, 3]}>
            {/* <BoxLand position={[0,1.6,0]} args={[4.01,0.31,6.01]} GSIRatio={loadingRatio} type="hard" /> */}

            <HardSurface position={[0,1.6,0]} args={[4.01,0.31,6.01]} GSIRatio={loadingRatio} color='lightgrey' />
            <GSISurface position={[0,1.6,-6]} args={[4,0.3,6]} GSIRatio={loadingRatio} color='green' prevGSIRatio={prevLoadingRatio}/>
            <GSIDepth position={[0,3,-6.01]} args={[4.001,2.501,6.005]} GSIRatio={loadingRatio} depth={depthUnit[depth]} color='yellow' prevGSIRatio={prevLoadingRatio}/>
            {/* <BoxLand position={[0,0,0]} args={[5,1,7]} GSIRatio={loadingRatio} height={depthUnit[depth]} color='yellow' type="soil" /> */}
            <BoxLand position={[0,0,0]} args={[4,3,6]}  color='pink'/>
            
          </group>
          <OrbitControls makeDefault />
          
        </Canvas>
      </div>

    </div>
  );
}

export default App;
