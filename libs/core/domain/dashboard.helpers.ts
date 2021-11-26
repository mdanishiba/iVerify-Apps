import * as moment from 'moment';
import { isEmpty, orderBy, uniqBy, flatten, keyBy } from 'lodash';
import { TicketsByType, TicketCatResFormat, StatusFormatPieChart, StatusFormat, Statuses } from '../models/dashboard';

const showItems = 5;

const FormatDate = (date: Date, format: string = 'YYYY-MM-DD') => {
  return moment(date).format(format);
}

const SortStatistics = (results: any) => {

  let data = results;
  if (!isEmpty(data)) {
    for (const [key, value] of Object.entries(data)) {
      const sorted = Object.entries(value).sort((a: any, b: any) => b[1] - a[1]);
      data[key] = sorted;      
    }
  }
  return data;
}

const GetTicketsByType = (res: any) => {
  let processedData: any = [];
  if (!isEmpty(res)) {
    processedData = GetCountFromRes(res);
  }
  return processedData;
}

const GetTicketsByChannel = (res: any) => {
  let processedData: any = [];
  if (!isEmpty(res)) {
    res.forEach((value: string[], index: number) => {
      if (!isEmpty(value[0]) && index < showItems) {
        const category = {
          name: value[0],
          value: value[1]
        };
        processedData.push(category);
      }
    });
  }
  return processedData;
};

const GetCountFromRes = (res: any[]) => {

  let modified: any = [];
  if (res && res.length > 0) {
    let newArr = res.map((itemVal: any) => {
        let temp = itemVal[1].filter((item: any) => (item.count !== 0));
        return temp;
    });
    newArr = uniqBy(flatten(newArr), 'category');
    let sortData = orderBy(newArr, ['count'], ['desc']); 
    sortData.forEach((value: TicketCatResFormat, index: number) => {
        if (!isEmpty(value.category) && index < showItems) {
          const category = {
            name: value.category,
            value: value.count
          };
          modified.push(category);
        }
    });
  }
  return modified;
}

const GetTicketsByTag = (res: any[]) => {
  let processedData: any = [];
  if (!isEmpty(res)) {
    processedData = GetCountFromRes(res);
  }
  return processedData;
};

const GetTicketsByCurrentStatus = (res: any) => {
    let processedData: StatusFormatPieChart[] = [];
    if (!isEmpty(res)) {
      const statuses = res.status;

      let newArr = statuses.map((itemVal: any) => {
        let temp = itemVal[1].filter((item: any) => (item.category === Statuses.Unstarted || item.category === Statuses.InProgress || item.category === Statuses.PreChecked));
        temp = uniqBy(temp, 'category');
        return temp;
      });
    
      newArr = flatten(newArr);
      let sortData = orderBy(newArr, ['count'], ['desc']); 

      const unstarted = sortData.filter((it: any) => it.category === Statuses.Unstarted);
      const inprogress = sortData.filter((it: any) => it.category !== Statuses.Unstarted);
      const precheckedCount = sortData.filter((it: any) => it.category === Statuses.PreChecked);

      processedData.push(
        {
          name: unstarted[0].category,
          value: unstarted[0].count + precheckedCount[0].count,
          label: 'Unstarted'
        }, {
          name: inprogress[0].category,
          value: inprogress[0].count,
          label: 'Inprogress'
        }
      );              

      if (!isEmpty(statuses)) {

        let newArr = statuses.map((itemVal: any) => {
          let temp = itemVal[1].filter((item: any) => (item.category !== Statuses.Unstarted && item.category !== Statuses.InProgress && item.category !== Statuses.PreChecked));
          temp = uniqBy(temp, 'category');
          return temp;
        });
        newArr = flatten(newArr);
        let sortedPublished = orderBy(newArr, ['count'], ['desc']); 
        sortedPublished = uniqBy(sortedPublished, 'category'); 
        const completedCount = sortedPublished.reduce((acc, curr) => {
            acc['count'] += parseInt(curr.count);
            return acc;
        });

        let newItem = {
          name: 'Completed',
          value: completedCount.count,
          label: 'Completed'
        };
        processedData.push(newItem);
      }
    }
    return processedData;
};

const GetTicketsByAgents = (res: any) => {

  let processedData: any = [], responseItems: any = [];
  const iteratorArray = [TicketsByType.agentUnstarted, TicketsByType.agentSolved, TicketsByType.agentProcessing];  
  iteratorArray.forEach((val: any)=> {
    if (!isEmpty(res[val])) {
      let temp: any = [];
      res[val].forEach((item: any)=> {
          if (item[0] !== 'undefined') {
            temp[item[0]] = item[1];
          }
      });
      responseItems[val] = temp;
    }
  });
  const unstarted = keyBy(GetCountFromRes(res[TicketsByType.agentUnstarted]), (o)=> o.name);
  const progressing = keyBy(GetCountFromRes(res[TicketsByType.agentProcessing]), (o)=> o.name);
  const solved  = keyBy(GetCountFromRes(res[TicketsByType.agentSolved]), (o)=> o.name);

  if (!isEmpty(unstarted)) {
      Object.keys(unstarted).forEach((categoryName: string, index: number) => {
        if (index < showItems) {
          if (categoryName !== "undefined") {
            let agentData: any = {};
            agentData['name'] = categoryName;
            agentData['series'] = [
              {
                "name": "Unstarted",
                "value": (unstarted && unstarted[categoryName]) ? unstarted[categoryName].value : 0
              },
              {
                "name": "Started",
                "value": (progressing && progressing[categoryName]) ? progressing[categoryName].value : 0
              },
              {
                "name": "Solved",
                "value": (solved && solved[categoryName]) ? solved[categoryName].value : 0
              }
            ];
            processedData.push(agentData);
          }
        }
      });
  }

  return processedData;
}

const weeksBetween = (d1: any, d2: any): any => {
    let start = new Date(d1);
    let end = new Date(d2);
    let sDate;
    let eDate;
    let dateArr = [];

    while(start <= end){
      if (start.getDay() == 1 || (dateArr.length == 0 && !sDate)){
        sDate = new Date(start.getTime());
      }

      if ((sDate && start.getDay() == 0) || start.getTime() == end.getTime()){
            eDate = new Date(start.getTime());
      }

      if(sDate && eDate){
        dateArr.push({'startDate': FormatDate(sDate), 'endDate': FormatDate(eDate)});
        sDate = undefined;
        eDate = undefined;
      }

        start.setDate(start.getDate() + 1);
    }
    return dateArr;
}

const GetTotalCount = (dataSet: any, category: string) => {
  let temp = dataSet.map((itemVal: any) => {
              return uniqBy(itemVal[1], 'category');
            });

    temp = flatten(temp);
    let sortedPublished = orderBy(temp, ['count'], ['desc']); 
    sortedPublished = sortedPublished.filter((it: any) => it.category == category);
    return (sortedPublished && sortedPublished.length > 0) ? sortedPublished[0].count : 0;
}

const GetTicketsByWeek = (res: any, dates: any) => {
  const statuses = res[TicketsByType.status];
  let unstartedStatuses: StatusFormat[] = [], publishedStatuses:StatusFormat[] = [], inprogressStatuses: StatusFormat[] = [];
  const startDate = new Date(dates.startDate);
  const endDate = new Date(dates.endDate);
  const weekData = weeksBetween(startDate, endDate);
  if (!isEmpty(statuses)) {

    if (weekData.length > 0) {

      weekData.forEach((range: any) => {
        let ticketsByStatus = statuses.filter((item: any) => {
          const date = new Date(item[0]).getTime();
          const startDateTime = new Date(range.startDate).getTime();
          const endDateTime   = new Date(range.endDate).getTime();
          return date >= startDateTime && date <= endDateTime;
        });

        if (!isEmpty(ticketsByStatus)) {
            const unstartedCount = GetTotalCount(ticketsByStatus, Statuses.Unstarted);
            const precheckedCount = GetTotalCount(ticketsByStatus, Statuses.PreChecked);
            let temp = {
              name: FormatDate(range.startDate, "MM/DD"),
              value: unstartedCount + precheckedCount
            }
            unstartedStatuses.push(temp);
        }

        if (!isEmpty(ticketsByStatus)) {
          const inprogressCount = GetTotalCount(ticketsByStatus, Statuses.InProgress);
            let temp = {
              name: FormatDate(range.startDate, "MM/DD"),
              value: inprogressCount
            }
            inprogressStatuses.push(temp);          
        }

        let completedCount = 0;
        if (!isEmpty(ticketsByStatus)) {
            [Statuses.False, Statuses.True, Statuses.OutOfScope, Statuses.PartlyFalse, Statuses.Inconclusive, Statuses.Misleading].forEach((status) => {
              completedCount += GetTotalCount(ticketsByStatus, status);
            });
        }

        if (completedCount > 0) {
          let temp = {
            name: FormatDate(range.startDate, "MM/DD"),
            value: completedCount
          }
          publishedStatuses.push(temp);
        }
      });
    }
  }

  if (unstartedStatuses.length > 0 || inprogressStatuses.length > 0 || publishedStatuses.length > 0) {
    const finalStatusesByWeek = [
          {
            name: Statuses.Unstarted,
            series: unstartedStatuses
          },
          {
            name: 'Inprogress',
            series: inprogressStatuses
          },
          {
            name: 'Completed',
            series: publishedStatuses
          }   
    ]
    return finalStatusesByWeek;
  }
  return null; 
}

const daysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
}

const GetPreviousWeekFirstDay = ()=> {
  let today = new Date();
  return new Date().setDate(today.getDate()-today.getDay()-6);
}

const GetFirstLastDayMonth = () => {
  const date = new Date();
  return {
    firstDay: new Date(date.getFullYear(), date.getMonth(), 1),
    lastDay: new Date(date.getFullYear(), date.getMonth(), daysInMonth(date.getMonth()+1, date.getFullYear()))
  }
}

export const DashboardHelpers = {
  FormatDate,
  SortStatistics,
  GetTicketsByChannel,
  GetTicketsByTag,
  GetTicketsByCurrentStatus,
  GetTicketsByAgents,
  GetFirstLastDayMonth,
  GetTicketsByWeek,
  GetPreviousWeekFirstDay,
  GetTicketsByType
};