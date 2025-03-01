from Services.CritSrvs.server import create_app, run_server
from Services.CritSrvs.polling import start_polling
import argparse
import threading

 ####
 ## IMPORTANT: HOW TO RUN POLLING AND DATABASES SERVICES
 ## Run both services: python main.py --server --polling
 ## Run only the server: python main.py --server
 ## Run only the polling: python main.py --polling
 ####

def main():
    parser = argparse.ArgumentParser(description='Start server and/or polling service')
    parser.add_argument('--server', action='store_true', help='Run the server')
    parser.add_argument('--polling', action='store_true', help='Run the polling service')
    args = parser.parse_args()

    if not (args.server or args.polling):
        print("Please specify at least one service to run: --server and/or --polling")
        return

    threads = []

    if args.server:
        server_thread = threading.Thread(target=run_server)
        threads.append(server_thread)
        server_thread.start()
        print("Server started")

    if args.polling:
        polling_thread = threading.Thread(target=start_polling)
        threads.append(polling_thread)
        polling_thread.start()
        print("Polling service started")

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

if __name__ == "__main__":
    main() 