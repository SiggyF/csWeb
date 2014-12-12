﻿module DashboardSelection {
    export interface IDashboardSelectionScope extends ng.IScope {
        vm: any; //DashboardSelectionCtrl; 
        addWidget: Function;
        title: string;

    }

    export class DashboardSelectionCtrl {
        public scope: any;

        // $inject annotation.   
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di           
        public static $inject = [
            '$scope',
            'layerService',
            'dashboardService',
            'mapService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: any,
            private $layerService: csComp.Services.LayerService,
            private $dashboardService: csComp.Services.DashboardService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {

            $scope.vm = this;

            $dashboardService.editMode = true;

            $messageBusService.subscribe("dashboardSelect", ((s: string, dashboard: csComp.Services.Dashboard) => {
                switch (s) {
                    case "selectRequest":
                        this.selectDashboard(dashboard);
                        break;
                }
            }));


        }

        public startDashboardEdit(dashboard : csComp.Services.Dashboard) {

            this.$layerService.project.dashboards.forEach((d: csComp.Services.Dashboard) => {
                if (d.id !== dashboard.id) d.editMode = false;
                }
            );
           

        }

        public stopEdit() {
            
            for (var property in this.$layerService.project.dashboards) {
                this.$layerService.project.dashboards[property].editMode = false;
            }
            //this.activeWidget = null;

            //this.$scope.gridsterOptions.draggable.enabled = false;
            //this.$scope.gridsterOptions.resizable.enabled = false;
        }

        public startEdit() {
            // this.$scope.gridsterOptions.draggable.enabled = true;
            //this.$scope.gridsterOptions.resizable.enabled = true;
        }

        /** Add new dashboard */
        public addDashboard(widget: csComp.Services.IWidget) {
            var id = csComp.Helpers.getGuid();
            var d = new csComp.Services.Dashboard();
            d.id = id;
            d.name = "New Dashboard";
            this.$layerService.project.dashboards.push(d);
        }

        /** Remove existing dashboard */
        public removeDashboard(key: string) {            
            this.$layerService.project.dashboards = this.$layerService.project.dashboards.filter((s : csComp.Services.Dashboard) => s.id !== key);
            
        }

        public toggleTimeline() {
            this.$dashboardService.mainDashboard.showTimeline = !this.$dashboardService.mainDashboard.showTimeline;
            this.checkTimeline();
        }


        public toggleMap() {
            setTimeout(() => {
                this.checkMap();
            }, 100);

        }

        public checkTimeline() {

            if (this.$dashboardService.mainDashboard.showTimeline != this.$mapService.timelineVisible) {
                if (this.$dashboardService.mainDashboard.showTimeline) {
                    this.$mapService.showTimeline();
                } else {
                    this.$mapService.hideTimeline();
                }
                if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
            }
        }

        public checkMap() {

            if (this.$dashboardService.mainDashboard.showMap != this.$mapService.isVisible) {
                if (this.$dashboardService.mainDashboard.showMap) {
                    this.$mapService.show();
                } else {
                    this.$mapService.hide();
                }
                if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
            }
        }


        public checkViewbound() {
            if (this.$dashboardService.mainDashboard.viewBounds) {
                this.$mapService.map.fitBounds(new L.LatLngBounds(this.$dashboardService.mainDashboard.viewBounds.southWest, this.$dashboardService.mainDashboard.viewBounds.northEast));
            }
        }

        /** publish a message that a new dashboard was selected */
        private publishDashboardUpdate() {
            this.$messageBusService.publish('dashboard', 'onDashboardSelected', this.$dashboardService.mainDashboard);
        }

        /** Select an active dashboard */
        public selectDashboard(dashboard: csComp.Services.Dashboard) {
            //var res = JSON.stringify(this.$dashboardService.dashboards);
            this.$layerService.project.dashboards.forEach((d: csComp.Services.Dashboard) => { d.editMode = false; });

            if (dashboard) {
                this.$dashboardService.mainDashboard = dashboard;
                if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }


                this.checkMap();
                this.checkTimeline();
                this.checkViewbound();
                this.publishDashboardUpdate();

                // render all widgets
                //this.refreshDashboard();
            }
        }

    }
}  