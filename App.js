/* eslint-disable no-undef */
import React, {useEffect, PermissionsAndroid, useState} from 'react';
import {View, Image, Button, Platform, Dimensions} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const SERVER_URL = 'http://localhost:3000';
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 1.0;

const initialState = {
  latitude: null,
  longitude: null,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LATITUDE_DELTA * ASPECT_RATIO,
};

const createFormData = (photo, body = {}) => {
  const data = new FormData();

  data.append('photo', {
    name: photo.fileName,
    type: photo.type,
    uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
  });

  Object.keys(body).forEach(key => {
    data.append(key, body[key]);
  });

  return data;
};

const App = () => {
  const [photo, setPhoto] = React.useState(null);
  const [curentPosition, setCurentPosition] = useState(initialState);
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);

  const initialName = {
    namePosition: '',
  };
  const handleChoosePhoto = () => {
    launchImageLibrary({noData: true}, response => {
      console.log(response.assets[0].uri);
      if (response) {
        setPhoto(response.assets[0]);
      }
    });
  };
  const handleTakePhoto = () => {
    let options = {
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    launchCamera(options, response => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
        alert(response.customButton);
      } else {
        setPhoto(response.assets[0]);
        // const source = { uri: response.uri };
        // console.log('response', JSON.stringify(response));
        // this.setState({
        //   filePath: response,
        //   fileData: response.data,
        //   fileUri: response.uri
        // });
      }
    });
  };

  const handleUploadPhoto = () => {
    fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: createFormData(photo, {userId: '123',lat:lat,long:long}),
    })
      .then(response => response.json())
      .then(response => {
        console.log('response', response);
      })
      .catch(error => {
        console.log('error', error);
      });
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        // alert("You don't have access for the location")
      }
    } catch (err) {
      alert(err);
    }
  };


  const getLocationPermissions = async () => {
    const granted = await request(
      Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      }),
      {
        title: 'DemoApp',
        message: 'DemoApp would like access to your location ',
      },
    );
  
    return granted === RESULTS.GRANTED;
  };
  
  useEffect( async() => {
   getLocationPermissions();
   Geolocation.getCurrentPosition(
    (position) => {
      console.log('helow',position);
      const { longitude, latitude } = position.coords;
      setLat(latitude);
        setLong(longitude);

    },
    (error) => {
      // See error code charts below.
      console.log(error.code, error.message);
    },
    { enableHighAccuracy: true, timeout: 15000 }
);



  }, []);
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
      }}>
      {photo && (
        <>
          <Image source={{uri: photo.uri}} style={{width: 300, height: 300}} />
          <Button title="Upload Photo" onPress={handleUploadPhoto} />
        </>
      )}
      <Button title="Take Photo" onPress={handleTakePhoto} />
      <Button title="Choose Photo" onPress={handleChoosePhoto} />
    </View>
  );
};

export default App;
