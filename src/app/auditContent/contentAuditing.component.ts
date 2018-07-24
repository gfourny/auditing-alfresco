import { Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { DatePipe } from '@angular/common'

import 'rxjs/Rx';
import 'rxjs/add/operator/map';


@Component({
    selector: 'auditing-content',
    templateUrl: 'contentAuditing.html',
    styleUrls: ['contentAuditing.css']
  })
  
  export class ContentAuditing {

    headers: Headers;
    optionsHttp: RequestOptions;
    count: number;
    public daterange: any = {};


    constructor(private http : Http, public dialog: MatDialog){
        this.headers = new Headers();
        this.headers.append('Authorization', 'Basic ' + btoa('admin:Password01'));
        this.headers.append('Content-Type', 'application/json');
        this.optionsHttp = new RequestOptions();
        this.optionsHttp = new RequestOptions({ headers: new Headers(this.headers), withCredentials: true });
      };

    public barChartOptions:any = {
        scaleShowVerticalLines: false,
        responsive: true
      };

    public options: any = {
    locale: { format: 'DD-MM-YYYY' },
    alwaysShowCalendars: false,
    };

    public barChartLabels:string[] = [];
    public _barChartLabels: string[];
    public barChartType:string = 'bar';
    public barChartLegend:boolean = true;
    public barChartColors:Array<any> = [
        {
            backgroundColor: 'rgba(237,108,37,0.65)'
        }
    ];
     
    public barChartData:any[] = [
    {data: [], label: 'Nombre de documents modifiés'}
    ];

    
     
    private getData(timeStart: number, timeEnd: number) {
    //On obtient l'ensemble du json qui nous est retourné par l'api d'alfresco;
    var entries: any;
    entries = this.http
                    .get("http://localhost:800/alfresco/service/api/audit/query/AuditExampleExtractors?verbose=true&limit=1000&forward=true&fromTime="
                    + timeStart + "&toTime=" + timeEnd, this.optionsHttp)
                    .map((response: Response) => {
                    return response.json();
                    }).subscribe((data => {
                    entries = data.entries;
                    this.count = data.count;
                    this.refreshChart(entries);
                    }));
    }

    // Méthode qui permet de récupérer les dates de début et de fin sélectionnées
    private selectedDate(value: any, datepicker?: any) {
    this._barChartLabels = new Array();
    this.barChartData = [
        {
        data:[],
        label:"Nombre de documents modifiés"
        }
    ];
    let endDate: string;
    let startDate: string;

    datepicker.start = value.start;
    datepicker.end = value.end;

    this.daterange.start = value.start;
    this.daterange.end = value.end;
    this.daterange.label = value.label;

    endDate = this.daterange.end;
    this.daterange.end = new Date(this.daterange.end);

    startDate = this.daterange.start;
    this.daterange.start = new Date(this.daterange.start);

    this.daterange.start = Date.parse(this.daterange.start);
    this.daterange.end = Date.parse(this.daterange.end);

    this.openDialog();
    this.getData(this.daterange.start, this.daterange.end);
    }

    // Méthode qui permet de vérifier que la date contenu dans le retour le l'api d'alfresco est comprise entre
    // la date de début et de fin sélectionnée par l'utilisateur.
    private isBetween(my_date, my_debut, my_fin):Boolean {

        let retour:boolean = false;
        //my_date = new Date(my_date).getTime();


        if (my_date >= my_debut && my_date <= my_fin){
            retour = true;
            // console.log("La date " + my_date + " est comprise entre le " + my_debut + " et le " + my_fin);
        } else {
            // console.log("La date " + my_date + " n'est pas comprise entre le " + my_debut + " et le " + my_fin);
        }
        return retour;
    }

    private refreshChart(entries: [any]){

        var nDocument = 0;
        let oldDate: number;
        var j:any;
        var date: number;
        var dateString: number;
        var datePipe = new DatePipe('fr-FR');
        var dateSplited;
        var oldDateSplited;
        var dateStringSplited;

        //TODO définir les valeurs par défaut dans le picker
        //On vérifie que les bornes ont été définit
        if(this.daterange.start == undefined && this.daterange.end == undefined){
            console.log("la date de début et de fin n'ont pas été défini.");
            this.daterange.start = "946681200000";
            this.daterange.end = "1546297200000";
            this.getData(this.daterange.start, this.daterange.end);
        }

        //Définition d'une limite, correspond à la limite donnée en paramèter de la requête http
        var limit = 1;
        //Récupération de la première date du retour obtenue
        oldDate = entries[0].time;
        oldDate = new Date(oldDate).getTime();
        
        //Itération sur chaque entrée du retour JSON
            for (j in entries) {
            //Récupération de la date dans notre entrée
            date = entries[j].time;
            dateString = new Date(date).getTime();
            //On vérifie que la date récupérée dans le json se trouve entre les bornes de date de début et de fin
            if(this.isBetween(dateString, this.daterange.start, this.daterange.end)){
                //Compare l'égalité entre oldDate et date.
                dateSplited = datePipe.transform(oldDate).split(' ');
                oldDateSplited = dateSplited[1] + ' ' + dateSplited[2];
                dateSplited = datePipe.transform(dateString).split(' ');
                dateStringSplited = dateSplited[1] + ' ' + dateSplited[2];
                if(oldDateSplited === dateStringSplited){
                //Si vrai, incrémentation du nombre de documents.
                console.log(oldDateSplited);
                nDocument = nDocument + 1;
                } else {
                //Si faux, ajout du nDocument dans barChartData.
                nDocument = nDocument / 2;
                this.barChartData[0].data.push(nDocument);
                //Ajout de la date dans lineChartLabels
                this._barChartLabels.push(oldDateSplited);
                //nDocument est remis à zéro
                nDocument = 0;
                }
                // oldDate prend la valeur de la date en cours
                oldDate = dateString;
            }
            //Incrémentation de la limite
            limit = limit + 1;
            //Condition si la limite est atteinte et que la dernière date traitée est inférieur à la date de fin défini dans le 
            //dateRangePicker
            if(limit === 1000 && oldDate < this.daterange.end){
                //La limite est remise à zéro
                limit = 0;
                //Execution d'une nouvelle requête en attribuant la date de début à la dernière date traitée
                this.getData(oldDate, this.daterange.end);
            }
        }
        //Condition si la dernière date traitée est égale à la date de fin définit
        if(this.count < 1000){
            //Ajout du nombre de nDocument
            nDocument = nDocument / 2;
            this.barChartData[0].data.push(nDocument);
            //Ajout de la date dans _lineChartLabels
            this._barChartLabels.push(dateStringSplited);
            //mise à jour du lineChartLabels
            this.barChartLabels = this._barChartLabels
            //Fermeture de l'icône de chargement des données
            this.dialog.closeAll();
        }
    }


    openDialog(): void {
    let dialogRef = this.dialog.open(DialogOverviewExampleDialogContent, {
        width: '400px',
        height: '400px'
    });
    }

    closeDialog(): void {
    this.dialog.closeAll();
    }
  }

  @Component({
    selector: 'dialog-overview-example-dialog',
    templateUrl: '../spinner.html',
    styleUrls: ['../spinner.css']
  })
  
  export class DialogOverviewExampleDialogContent {
    resourcesLoaded = true;
  
    constructor(
      public dialogRef: MatDialogRef<DialogOverviewExampleDialogContent>,
      @Inject(MAT_DIALOG_DATA) public data: any) { }
  
    onNoClick(): void {
      this.dialogRef.close();
    }
  }