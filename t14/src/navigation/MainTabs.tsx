import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '@/screens/home/HomeScreen';
import Profile from '@/screens/profile/ProfileScreen';
import GruposNavigator from '@/navigation/GruposNavigator'
import colors from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import Amigos from '@/screens/auth/Amigos';
import Notificacoes from '@/screens/auth/Notificacoes';

function Placeholder({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{label}</Text>
    </View>
  );
}

type TabIconProps = { color: string; size: number; focused: boolean };

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,                     
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#fff' },
        tabBarIcon: ({ color, size, focused }: TabIconProps) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Grupos: focused ? 'people' : 'people-outline',
            Amigos: focused ? 'person-add' : 'person-add-outline',
            Notificacoes: focused ? 'notifications' : 'notifications-outline',
            Perfil: focused ? 'person' : 'person-outline',
          };
          const name = map[route.name] ?? 'ellipse';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Grupos" children={() => <Placeholder label="Grupos" />} />
      <Tab.Screen name="Amigos" component={Amigos}/> 
      <Tab.Screen name="Notificacoes" component={Notificacoes} options={{tabBarLabel:"Notificações", headerTitle:"Notificações"}} />
      <Tab.Screen name="Grupos" component={GruposNavigator} options={{headerShown: false}}/>
      <Tab.Screen name="Amigos" children={() => <Placeholder label="Amigos" />} />
      <Tab.Screen name="Notificações" children={() => <Placeholder label="Notificações" />} />
      <Tab.Screen name="Perfil" component={Profile} />
    </Tab.Navigator>
  );
}
