
import os
import json
from supabase import create_client, Client

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def check_master_trips():
    res = supabase.from_("user_backups").select("data").eq("user_id", "authentic").execute()
    if res.data:
        data = res.data[0].get("data", {})
        master_trips = data.get("master_trips", data.get("masterTrips", []))
        print(f"Total Master Trips found: {len(master_trips)}")
        for mt in master_trips:
            acc = mt.get("accommodation")
            print(f"Trip: {mt.get('name')} (ID: {mt.get('id')})")
            if acc:
                mecca_rooms = len(acc.get('mecca', {}).get('rooms', []))
                medina_rooms = len(acc.get('medina', {}).get('rooms', []))
                print(f"  - Accommodation FOUND: Mecca Rooms: {mecca_rooms}, Medina Rooms: {medina_rooms}")
            else:
                print(f"  - Accommodation: MISSING (EMPTY)")

if __name__ == "__main__":
    check_master_trips()
