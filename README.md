# Daily-Water-Intake-Tracker


## Opis projektu
Daily Water Intake Tracker to aplikacja typu Progressive Web App (PWA), która pomaga użytkownikom monitorować dzienne spożycie wody, ustawiać cele nawodnienia oraz przeglądać statystyki tygodniowe.  
Aplikacja działa zarówno online, jak i offline oraz może zostać zainstalowana na urządzeniu mobilnym.

---

## Demo online
https://cosmic-gaufre-99f0e9.netlify.app

---

## Wykorzystane technologie
- HTML5  
- CSS3  
- JavaScript (Vanilla)  
- IndexedDB  
- Service Workers  
- Cache API  
- Notifications API  
- Geolocation API  

---

##  Funkcjonalności aplikacji
- Rejestrowanie dziennego spożycia wody  
- Ustawianie dziennego celu nawodnienia  
- Dodawanie napojów  
- Przegląd statystyk tygodniowych  
- Przechowywanie danych lokalnie (IndexedDB)  
- Działanie w trybie offline  
- Instalacja aplikacji jako PWA  

---

##  Wykorzystane natywne funkcje urządzenia

###  Powiadomienia (Notifications API)
Aplikacja wykorzystuje Notifications API do wysyłania powiadomień przypominających użytkownikowi o nawodnieniu.  
Użytkownik musi wyrazić zgodę na otrzymywanie powiadomień.

###  Geolokalizacja (Geolocation API)
Aplikacja wykorzystuje Geolocation API do pobrania lokalizacji użytkownika (np. współrzędnych lub miasta).  
Funkcja jest opcjonalna i wymaga zgody użytkownika.

---

## Tryb offline
Aplikacja działa w trybie offline dzięki:
- Service Workers
- Cache API

W przypadku braku połączenia z internetem użytkownik jest informowany o trybie offline i może nadal korzystać z podstawowych funkcji aplikacji.

---

##  Widoki aplikacji
Aplikacja posiada kilka logicznie powiązanych widoków:
- **Home** – bieżący postęp nawodnienia  
- **Add Drink** – dodawanie spożytej wody  
- **Statistics** – statystyki tygodniowe  
- **Settings** – ustawienia celu, powiadomień i lokalizacji  

---

##  Instalacja aplikacji (PWA)
- **Android / Chrome**: opcja „Zainstaluj aplikację” w przeglądarce  
- **iOS / Safari**: Udostępnij → Dodaj do ekranu początkowego  

---

##  Uruchomienie projektu lokalnie
1. Sklonuj repozytorium  
2. Otwórz plik `index.html` w przeglądarce  
   lub  
3. Uruchom projekt na lokalnym serwerze (zalecane dla Service Workers)

---

