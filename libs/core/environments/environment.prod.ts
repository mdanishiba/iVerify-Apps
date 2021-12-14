export const environment = {
  production: true,
  api: {
    base: 'https://api-undpjtf-iverify-honduras-js.leman.un-icc.cloud',
    version: 'v3'
  },
  authentication: {
    client_id: 'ushahidiui',
    client_secret: '35e7f0bca957836d05ca0492211b0ac707671261',
    token_header: 'authorization'
  },
  ngHttpLoaderConfig: {
    backdrop: true,
    backgroundColor: '#000000',
    debounceDelay: 100,
    extraDuration: 500,
    minDuration: 500,
    opacity: '0.5',
    spinner: 'skWanderingCubes',
    filteredUrlPatterns: ['open.mapquestapi.com', 'notifications_ex', 'audit', 'comments']
  },
  deploymentName: 'EWER Zambia',
  footer: {
    visible: false,
    text: 'All rights reserved EC-UNDP Joint Task Force',
    links: [
      {
        text: 'Terms of use',
        link: ''
      },
      {
        text: 'Privacy Policy',
        link: ''
      }
    ]
  },
  map: {
    shapeFiles: [
      {
        uri: 'assets/shapefiles/administrative-boundaries-zambia.zip',
        config: [
          {
            fileName: 'Provinces',
            altName: 'Provinces',
            base: true,
            selected: true,
            options: {
              style: {
                color: '#3b746b',
                opacity: '1',
                weight: '4',
                dashArray: ''
              }
            }
          },
          {
            fileName: 'Districts',
            altName: 'Districts',
            base: true,
            selected: true,
            options: {
              style: {
                color: 'green',
                opacity: '1',
                weight: '4',
                dashArray: '1'
              }
            }
          },
          {
            fileName: 'Wards',
            altName: 'Wards',
            base: true,
            selected: true,
            options: {
              style: {
                color: 'grey',
                opacity: '0.5',
                weight: '1',
                dashArray: '2'
              }
            },
            listenForClick: {
              enabled: true,
              dispatchProperties: true
            }
          }
        ]
      }
    ]
  },
  format: {
    date: 'DD/MM/YYYY',
    time: 'HH:mm:ss',
    dateTime: 'DD/MM/YYYY HH:mm:ss',
    dateTimeWithoutSec: 'DD/MM/YYYY HH:mm'
  },
  form: {
    id: 1
  },
  geocoding: {
    provider: 'mapquest',
    mapquest: {
      url: 'https://open.mapquestapi.com/nominatim/v1/search.php',
      key: 'u1eKB28V0nFccp8v96q3Yt8ihTJVAo5P'
    }
  },
  defaults: {
    tagColor: '#4282c2',
    tagIncidentColor: '#3b746b',
    tagRiskColor: '#27b8ba',
    tagIcon: 'fa fa-map-marker',
    tagType: 'incident'
  },
  notifications: {
    enabled: true,
    timing: 900
  },
  countryCodes: [
    {
      countryCode: 'en',
      countryLanguage: 'English'
    }
  ],
  availableLanguages:[
    "en"
  ],
  defaultLanguage: "en",
  defaultCountryCode: 'ZM',
  app_state_key: 'app_storage',
  xAxisLabel: 'Report dates',
  yAxisLabel: 'No of reports',
  flexmonster:{
    licenseKey : 'Z7SQ-XH7G40-4C6Z3O-03166H-1Q3P1W-6S3Z4T-621V0F-3Y5P27-55'
  },
  export: {
    timing: 5,
    expoerted_file_name: 'Reports.csv',
    expoerted_user_file_name: 'Users.csv'
  },
  riskMapOptions: [
    {
      name: 'FORECASTED_RISK',
      value: 0,
      isDefault: true
    },
    {
      name: 'EXTENDED_RISK',
      value: 1
    },
    {
      name: 'CURRENT_RISK',
      value: 2
    }
  ],
  mapRefreshInMinutes : 5
};
