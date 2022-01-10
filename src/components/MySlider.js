import React,{useState} from 'react';
import Box from '@mui/material/Box';
import {Slider, Typography} from '@mui/material';
//https://stackoverflow.com/questions/47440051/get-mui-slider-value-in-ondragstop-event

function valuetext(value) {
    return `${value}°C`;
}

const MySlider = (props) => {
    const { min, max, marks, title, onChange, step, defaultVal, value} = props;
    const valueLabelFormat = (value) => {
      //error if using Array.find()
      if(title !== "Design Storm")
      return marks.filter((mark) => mark.value === value)[0].label;
      else return value + " inches";
    }
    // const changeValue = (evt, value) =>{
    //   setValue(value);
    //   console.log(value);
    // }
    return (
        <Box sx={{ width: 300, ml: 4 }}>
            <Typography gutterBottom>{title}</Typography>
            <Slider
                min={min}
                max={max}
                aria-label="Restricted values"
                // defaultValue={marks[0].value}
                defaultValue={defaultVal}
                getAriaValueText={valuetext}
                step={step}
                valueLabelFormat={ valueLabelFormat}
                valueLabelDisplay="auto"
                marks={marks}
                onChange={onChange}
                value = {value}
            />
        </Box>
    );
};

export default MySlider;
