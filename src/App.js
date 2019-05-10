import React, { Component, useState, useEffect } from 'react';

import {
  Charts,
  ChartContainer,
  ChartRow,
  YAxis,
  LineChart,
  LabelAxis
} from 'react-timeseries-charts';

import { TimeSeries, TimeRange } from 'pondjs';
import './App.css';
import jsonData from './data/json_out.json'

class App extends Component {
  constructor(props) {
    super(props);

    const channelNames = [...Array(8).keys()].map(i => 'ch'+(i+1))

    const channels = {
        ch1: {
            units: "$",
            label: "ch1",
            format: ",.2f",
            series: null,
            show: true
        },
        ch2: { units: "$", label: "ch2", format: ",.2f", series: null, show: true },
        ch3: { units: "$", label: "ch3", format: ",.2f", series: null, show: true },
        ch4: { units: "$", label: "ch4", format: ",.2f", series: null, show: true },
        ch5: { units: "$", label: "ch5", format: ",.2f", series: null, show: true },
        ch6: { units: "$", label: "ch6", format: ",.2f", series: null, show: true },
        ch7: { units: "$", label: "ch7", format: ",.2f", series: null, show: true },
        ch8: { units: "$", label: "ch8", format: ",.2f", series: null, show: true }
    };

    // initial x-axis time range
    let range = new TimeRange(jsonData[0]["time"], jsonData[jsonData.length-1]["time"])

    // pagination variables
    const totalPages = 32
    const pageLength = 2500
    let currentPage = 1
    let allowPrevious = currentPage !== 1
    let allowNext = currentPage !== totalPages
    let firstPage = currentPage === 1
    let finalPage = currentPage === totalPages
    let previousPage = currentPage - 1
    let nextPage = currentPage + 1

    this.state =  {
      ready: false,
      range: range,
      data: jsonData,
      channelNames: channelNames,
      channels: channels,
      totalPages: totalPages,
      pageLength: pageLength,
      totalCount: totalPages * pageLength,
      currentPage: currentPage,
      // If the back button should be enabled
      allowPrevious: allowPrevious,
      // If the next button should be enabled
      allowNext: allowNext,
      // If we're on the first page
      firstPage: firstPage,
      // If we're on the last page
      finalPage: finalPage,
      // The index of the previous page
      previousPage: previousPage,
      // The index of the next page
      nextPage: nextPage

    }
  }

  componentDidMount() {
    setTimeout(() => {
      this.updateChannels(this.state.currentPage, this.state.pageLength);
      this.setState({ ready: true });
    }, 0);
  }

  updateChannels = (currentPage, pageLength) => {
    const { channelNames, channels, data } = this.state

    const points = {};
    channelNames.forEach(channel => {
        points[channel] = [];
    });

    const page = this.paginate(data, pageLength, currentPage);
    const range = new TimeRange(page[0]["time"], page[page.length-1]["time"])
    this.setState({range})

    for (const event of page) {
       const time = event["time"]
       points["ch1"].push([time, event["ch1"]*0.0447]);
       points["ch2"].push([time, event["ch2"]*0.0447]);
       points["ch3"].push([time, event["ch3"]*0.0447]);
       points["ch4"].push([time, event["ch4"]*0.0447]);
       points["ch5"].push([time, event["ch5"]*0.0447]);
       points["ch6"].push([time, event["ch6"]*0.0447]);
       points["ch7"].push([time, event["ch7"]*0.0447]);
       points["ch8"].push([time, event["ch8"]*0.0447]);
    }

    for (const channelName of channelNames) {

      const series = new TimeSeries({
        name: channels[channelName].name + currentPage,
        columns: ["time", channelName],
        points: points[channelName]
      });
      channels[channelName].series = series;

      channels[channelName].avg = parseInt(series.avg(channelName), 10);
      channels[channelName].max = parseInt(series.max(channelName), 10);
      channels[channelName].min = parseInt(series.min(channelName), 10);
      channels[channelName].stdev = parseInt(series.stdev(channelName), 10);
    }

    return channels
  }

  renderChart = () => {
    const { channels, channelNames, range } = this.state;

    const chartRows = [];
    for (const channelName of channelNames) {

      const series = channels[channelName].series

      const summary = [
         { label: "Max", value: channels[channelName].max },
         { label: "Min", value: channels[channelName].min },
         { label: "Avg", value: channels[channelName].avg },
         { label: "StDev", value: channels[channelName].stdev }
      ];

      chartRows.push(
        <ChartRow
          key={`row-${channelName}`}
          height="100"
        >
          <LabelAxis
            id={`${channelName}_axis`}
            label={channels[channelName].label}
            values={summary}
            min={channels[channelName].min}
            max={channels[channelName].max}
            width={200}
            type="linear"
            format=",.1f"
          />
          <YAxis
            id={`${channelName}-axis`}
            min={-100}
            max={100}
            key={`axis-${channelName}`}
            label={channelName}
            width="100"
            type="linear"
            format=".1f"
          />
          <Charts>
            <LineChart
              key={`line-${channelName}`}
              interpolation="curveLinear"
              axis={`${channelName}-axis`}
              series={series}
              columns={[channelName]}
            />
          </Charts>
        </ChartRow>
      );
    }
    return (
      <ChartContainer format="%S" transition={4} timeRange={range} width={800}>
         { chartRows }
      </ChartContainer>
    )
  }

  paginate = (array, perPage, page) => {
    --page;
    const pdata = array.slice(page * perPage, (page + 1) * perPage);
    return pdata;
  }

  onPageRequest = (page) => {
    const { pageLength, totalPages } = this.state
    const channels = this.updateChannels(page, pageLength)

    this.setState({
      currentPage: page,
      previousPage: page - 1,
      nextPage: page + 1,
      firstPage: page === 1,
      allowNext: page !== totalPages,
      allowPrevious: page !== 1,
      channels: channels
    });
  }

  render() {
    const { ready, allowPrevious, allowNext, previousPage, firstPage, pageLength, finalPage, totalCount, currentPage, totalPages, nextPage} = this.state;
    return (
      <div className="App" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <ul className="pager" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', color: 'royalBlue', listStyleType: 'none'}}>
          <li>
            <button onClick={allowPrevious && (() => this.onPageRequest(previousPage)) }>&larr; Previous</button>
          </li>&nbsp;
          <li>
            <div
              className="inline-block"
            >
              <strong>Page {currentPage}</strong> &nbsp;
              ({firstPage ?
                1 :
                previousPage * pageLength
              } &nbsp;
              to &nbsp;
              {finalPage ?
                totalCount :
                currentPage * pageLength
              } &nbsp;
              of &nbsp;
              {totalCount
              }) &nbsp;
              <strong>Total Pages: {totalPages}</strong>
            </div>
          </li>&nbsp;
          <li>
            <button onClick={allowNext && (() => this.onPageRequest(nextPage)) }>Next &rarr;</button>
          </li>
        </ul>
          { ready ? this.renderChart() : <div>Loading...</div>}
      </div>
    );
  }
}

export default App;
