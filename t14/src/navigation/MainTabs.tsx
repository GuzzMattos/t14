import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '@/screens/home/HomeScreen';
import Profile from '@/screens/profile/ProfileScreen';
import GruposNavigator from '@/navigation/GruposNavigator'
import colors from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import Amigos from '@/screens/friends/Amigos';
import Notificacoes from '@/screens/notify/Notificacoes';
import { useAuth } from '@/contexts/AuthContext';
import { observeUserNotifications, Notification } from '@/firebase/notification';

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
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = observeUserNotifications(user.uid, (notifications) => {
      const unread = notifications.filter(n => n.status === "UNREAD").length;
      setUnreadCount(unread);
    });

    return unsubscribe;
  }, [user]);

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
          
          // Adicionar badge para notificações
          if (route.name === 'Notificacoes' && unreadCount > 0) {
            return (
              <View style={{ position: 'relative' }}>
                <Ionicons name={name as any} size={size} color={color} />
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: '#E11D48',
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              </View>
            );
          }
          
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Amigos" component={Amigos}/> 
      <Tab.Screen name="Notificacoes" component={Notificacoes} options={{tabBarLabel:"Notificações", headerTitle:"Notificações"}} />
      <Tab.Screen name="Grupos" component={GruposNavigator} options={{headerShown: false}}/>
      <Tab.Screen name="Perfil" component={Profile} />
    </Tab.Navigator>
  );
}
