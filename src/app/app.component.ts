import { Component, Pipe, PipeTransform, OnInit, Inject } from '@angular/core';
import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { DatePipe } from '@angular/common'
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Alfresco';
  entries: any;
  count: number;
  headers: any;
  optionsHttp: any;
  maxEntries: number = 1000;

  constructor(private http : Http, public dialog: MatDialog){
    this.headers = new Headers();
    // FIXME : on sort ça au moins dans une constante !!! Et on prévoit un vrai login après
    this.headers.append('Authorization', 'Basic ' + btoa('admin:Password01'));
    this.headers.append('Content-Type', 'application/json');
    this.optionsHttp = new RequestOptions();
    this.optionsHttp = new RequestOptions({ headers: new Headers(this.headers), withCredentials: true });
  };

  public daterange: any = {};
  public options: any = {
        locale: { format: 'DD-MM-YYYY' },
        alwaysShowCalendars: false,
  };
  public lineChartData:Array<any> = [
    {
      data:[],
      label:"Nombre de connexions"
    }
  ];
  public lineChartLabels:Array<String> = [];
  public _lineChartLabels:Array<String>;
  public _lineChartTimeStamps: Array<number> = [];
  public lineChartOptions:any = {
    responsive: true
  };
  public lineChartColors:Array<any> = [
    {
      backgroundColor: 'rgba(8,71,114,0.65)',
      borderColor: '#ed6c25',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  public lineChartLegend:boolean = true;
  public lineChartType:string = 'line';

  //Méthode qui vient rafraichir le graphique afin d'afficher le nombre de connexions par date
  private refreshLineChartLabels(timeStart: number, timeEnd: number) {
    //On obtient l'ensemble du json qui nous est retourné par l'api d'alfresco;
    var entries: any;
    entries = this.http
                  .get("http://localhost:800/alfresco/service/api/audit/query/AuditExampleLogin2?verbose=true&limit=" + this.maxEntries + "&forward=true&fromTime="
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
    this._lineChartLabels = new Array();
    this.lineChartData = [
      {
        data:[],
        label:"Nombre de connexions"
      }
    ];
    this._lineChartTimeStamps = new Array();
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
    this.refreshLineChartLabels(this.daterange.start, this.daterange.end);
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

    // FIXME Faire putain de gaffe aux entries vides

    let oldDate: number;
    var j:any;
    var date: number;
    var dateStamp: number;
    var dayStamp: number;
    var datePipe = new DatePipe('fr-FR');

    //TODO définir les valeurs par défaut dans le picker
    //On vérifie que les bornes ont été définit
    if(this.daterange.start == undefined && this.daterange.end == undefined){
      console.log("la date de début et de fin n'ont pas été défini.");
      // FIXME : on compute vraiment les dates parce que sinon c'est pas lisible. Mettre ça en constante
      this.daterange.start = "946681200000";
      this.daterange.end = "1546297200000";
      this.refreshLineChartLabels(this.daterange.start, this.daterange.end);
    }

    //Récupération de la première date du retour obtenue
    oldDate = entries[0].time;
    oldDate = new Date(oldDate).getTime();
    
    //Itération sur chaque entrée du retour JSON
    for (j in entries) {
      //Récupération de la date dans notre entrée
      date = entries[j].time;
      dateStamp = new Date(date).getTime();
      dayStamp = Math.floor(dateStamp/(1000*3600*24));

      // Récupération du nombre de login référencés pour cette date
      // FIXME faire une map key = dayStamp valeur = index
      var index = this._lineChartTimeStamps.indexOf(dayStamp);
      if (index >= 0) {
        // Incrément du compteur déjà défini
        this.lineChartData[0].data[index] = this.lineChartData[0].data[index] + 1;
      } else {
        // Enregistrement d'une nouvelle date
        this._lineChartLabels.push(datePipe.transform(oldDate));
        this.lineChartData[0].data.push(1);
        this._lineChartTimeStamps.push(dayStamp);
      }

      // oldDate prend la valeur de la date en cours
      oldDate = dateStamp;
    }

    //Condition si la limite est atteinte et que la dernière date traitée est inférieur à la date de fin défini dans le 
    //dateRangePicker
    if(this.count == this.maxEntries){
        //Execution d'une nouvelle requête en attribuant la date de début à la dernière date traitée
        this.refreshLineChartLabels(oldDate, this.daterange.end);
    } else if(this.count < this.maxEntries){   
      //Condition si la dernière date traitée est égale à la date de fin définit
      //Fermeture de l'icône de chargement des données
      this.lineChartLabels = this._lineChartLabels;
      this.dialog.closeAll();
    }
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
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
  templateUrl: 'spinner.html',
  styleUrls: ['spinner.css']
})

export class DialogOverviewExampleDialog {
  resourcesLoaded = true;

  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}